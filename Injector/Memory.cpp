#include "Memory.h"
#include "Utils.h"
#include <iostream>
#include <TlHelp32.h>
#include <Psapi.h>
#include <algorithm>

HANDLE Memory::ProcessHandle = nullptr;
uintptr_t Memory::BaseAddress = 0;
DWORD Memory::ProcessID = 0;

// Enable debug privilege (required for protected processes)
bool EnableDebugPrivilege() {
    HANDLE hToken;
    TOKEN_PRIVILEGES tp;
    LUID luid;

    if (!OpenProcessToken(GetCurrentProcess(), TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, &hToken)) {
        return false;
    }

    if (!LookupPrivilegeValue(NULL, SE_DEBUG_NAME, &luid)) {
        CloseHandle(hToken);
        return false;
    }

    tp.PrivilegeCount = 1;
    tp.Privileges[0].Luid = luid;
    tp.Privileges[0].Attributes = SE_PRIVILEGE_ENABLED;

    if (!AdjustTokenPrivileges(hToken, FALSE, &tp, sizeof(TOKEN_PRIVILEGES), NULL, NULL)) {
        CloseHandle(hToken);
        return false;
    }

    CloseHandle(hToken);
    return GetLastError() == ERROR_SUCCESS;
}

bool Memory::Initialize(const wchar_t* processName) {
    // Enable debug privilege first!
    if (!EnableDebugPrivilege()) {
        std::cout << "[!] Failed to enable debug privileges!" << std::endl;
    }
    else {
        std::cout << "[+] Debug privileges enabled" << std::endl;
    }

    ProcessID = Utils::GetProcessID(processName);
    if (ProcessID == 0) return false;

    // Try multiple access levels
    ProcessHandle = OpenProcess(PROCESS_ALL_ACCESS, FALSE, ProcessID);

    if (!ProcessHandle) {
        // Fallback to reduced permissions
        ProcessHandle = OpenProcess(
            PROCESS_VM_READ | PROCESS_VM_WRITE | PROCESS_VM_OPERATION |
            PROCESS_QUERY_INFORMATION | PROCESS_CREATE_THREAD |
            PROCESS_SUSPEND_RESUME, FALSE, ProcessID);
    }

    if (!ProcessHandle) {
        std::cout << "[!] OpenProcess failed. Error: " << GetLastError() << std::endl;
        return false;
    }

    BaseAddress = GetModuleBase(processName);

    if (BaseAddress == 0) {
        // Try to get base from GTA5.exe instead
        BaseAddress = Utils::GetModuleBaseAddress(ProcessID, L"GTA5.exe");
    }

    return BaseAddress != 0;
}

void Memory::Shutdown() {
    if (ProcessHandle) {
        CloseHandle(ProcessHandle);
        ProcessHandle = nullptr;
    }
}

void Memory::ReadBuffer(uintptr_t address, void* buffer, size_t size) {
    SIZE_T read;
    ReadProcessMemory(ProcessHandle, (LPCVOID)address, buffer, size, &read);
}

void Memory::WriteBuffer(uintptr_t address, void* buffer, size_t size) {
    SIZE_T written;
    WriteProcessMemory(ProcessHandle, (LPVOID)address, buffer, size, &written);
}

uintptr_t Memory::ReadPointer(uintptr_t address, std::vector<unsigned int> offsets) {
    uintptr_t ptr = address;
    for (unsigned int offset : offsets) {
        ptr = Read<uintptr_t>(ptr);
        if (ptr == 0) return 0;
        ptr += offset;
    }
    return ptr;
}

uintptr_t Memory::PatternScan(const char* signature, const char* mask) {
    MODULEINFO modInfo = { 0 };

    // Get module info using NtQueryInformationProcess or Toolhelp
    HMODULE hMods[1024];
    DWORD cbNeeded;

    if (EnumProcessModules(ProcessHandle, hMods, sizeof(hMods), &cbNeeded)) {
        for (unsigned int i = 0; i < (cbNeeded / sizeof(HMODULE)); i++) {
            wchar_t szModName[MAX_PATH];
            if (GetModuleFileNameExW(ProcessHandle, hMods[i], szModName, sizeof(szModName) / sizeof(wchar_t))) {
                if (wcsstr(szModName, L"GTA5.exe") != nullptr || wcsstr(szModName, L"FiveM") != nullptr) {
                    GetModuleInformation(ProcessHandle, hMods[i], &modInfo, sizeof(modInfo));
                    break;
                }
            }
        }
    }

    if (modInfo.SizeOfImage == 0) {
        // Fallback: scan 2GB of memory
        modInfo.lpBaseOfDll = (LPVOID)BaseAddress;
        modInfo.SizeOfImage = 0x7FFFFFFF;
    }

    uintptr_t start = (uintptr_t)modInfo.lpBaseOfDll;
    size_t size = modInfo.SizeOfImage;

    std::vector<int> patternBytes = PatternToByte(signature);

    // Read in chunks to avoid large allocations
    const size_t chunkSize = 0x100000; // 1MB chunks
    std::vector<char> buffer(chunkSize);

    for (size_t chunk = 0; chunk < size; chunk += chunkSize) {
        size_t currentChunkSize = std::min(chunkSize, size - chunk);
        SIZE_T bytesRead;

        if (!ReadProcessMemory(ProcessHandle, (LPCVOID)(start + chunk),
            buffer.data(), currentChunkSize, &bytesRead)) {
            continue;
        }

        for (size_t i = 0; i < bytesRead - patternBytes.size(); i++) {
            bool found = true;
            for (size_t j = 0; j < patternBytes.size(); j++) {
                if (patternBytes[j] != -1 &&
                    (unsigned char)buffer[i + j] != patternBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return start + chunk + i;
            }
        }
    }

    return 0;
}

uintptr_t Memory::PatternScan(const char* signature) {
    // Auto-generate mask
    std::string mask;
    std::string cleanSig;

    char* temp = _strdup(signature);
    char* token = strtok(temp, " ");

    while (token) {
        if (strcmp(token, "??") == 0 || strcmp(token, "?") == 0) {
            mask += "?";
            cleanSig += "00 ";
        }
        else {
            mask += "x";
            cleanSig += token;
            cleanSig += " ";
        }
        token = strtok(nullptr, " ");
    }

    free(temp);

    // Trim trailing space
    if (!cleanSig.empty() && cleanSig.back() == ' ') {
        cleanSig.pop_back();
    }

    return PatternScan(cleanSig.c_str(), mask.c_str());
}

uintptr_t Memory::GetModuleBase(const wchar_t* moduleName) {
    return Utils::GetModuleBaseAddress(ProcessID, moduleName);
}

void Memory::SetMemoryProtection(uintptr_t address, size_t size, DWORD protection) {
    DWORD oldProtect;
    VirtualProtectEx(ProcessHandle, (LPVOID)address, size, protection, &oldProtect);
}

std::vector<int> Memory::PatternToByte(const char* pattern) {
    std::vector<int> bytes;
    char* start = (char*)pattern;
    char* end = start + strlen(pattern);

    for (char* current = start; current < end; ++current) {
        if (*current == ' ') continue;
        if (*current == '?') {
            bytes.push_back(-1);
            if (*(current + 1) == '?') current++;
        }
        else {
            bytes.push_back(strtoul(current, &current, 16));
        }
    }

    return bytes;
}