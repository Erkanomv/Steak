#include <Windows.h>
#include <cmath>
#include <vector>
#include <algorithm>
#include "Utils.h"
#include <TlHelp32.h>
#include <Psapi.h>
#include <sstream>

std::string Utils::WStringToString(const std::wstring& wstr) {
    if (wstr.empty()) return "";
    int size = WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), nullptr, 0, nullptr, nullptr);
    std::string str(size, 0);
    WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), &str[0], size, nullptr, nullptr);
    return str;
}

std::wstring Utils::StringToWString(const std::string& str) {
    if (str.empty()) return L"";
    int size = MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), nullptr, 0);
    std::wstring wstr(size, 0);
    MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), &wstr[0], size);
    return wstr;
}

std::string Utils::Format(const char* fmt, ...) {
    char buffer[1024];
    va_list args;
    va_start(args, fmt);
    vsnprintf(buffer, sizeof(buffer), fmt, args);
    va_end(args);
    return std::string(buffer);
}

DWORD Utils::GetProcessID(const wchar_t* processName) {
    DWORD pid = 0;
    HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);

    if (snap != INVALID_HANDLE_VALUE) {
        PROCESSENTRY32W pe;
        pe.dwSize = sizeof(pe);

        if (Process32FirstW(snap, &pe)) {
            do {
                if (_wcsicmp(pe.szExeFile, processName) == 0) {
                    pid = pe.th32ProcessID;
                    break;
                }
            } while (Process32NextW(snap, &pe));
        }
        CloseHandle(snap);
    }

    return pid;
}

uintptr_t Utils::GetModuleBaseAddress(DWORD pid, const wchar_t* moduleName) {
    uintptr_t base = 0;
    HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, pid);

    if (snap != INVALID_HANDLE_VALUE) {
        MODULEENTRY32W me;
        me.dwSize = sizeof(me);

        if (Module32FirstW(snap, &me)) {
            do {
                // Check if module name contains the search string
                if (_wcsicmp(me.szModule, moduleName) == 0 ||
                    wcsstr(me.szModule, moduleName) != nullptr) {
                    base = (uintptr_t)me.modBaseAddr;
                    break;
                }
            } while (Module32NextW(snap, &me));
        }
        CloseHandle(snap);
    }

    return base;
}

bool Utils::IsProcessRunning(DWORD pid) {
    HANDLE process = OpenProcess(PROCESS_QUERY_INFORMATION, FALSE, pid);
    if (!process) return false;

    DWORD exitCode;
    GetExitCodeProcess(process, &exitCode);
    CloseHandle(process);

    return exitCode == STILL_ACTIVE;
}

bool Utils::ReadMemory(HANDLE hProcess, uintptr_t address, void* buffer, size_t size) {
    SIZE_T read;
    return ReadProcessMemory(hProcess, (LPCVOID)address, buffer, size, &read) && read == size;
}

bool Utils::WriteMemory(HANDLE hProcess, uintptr_t address, void* buffer, size_t size) {
    SIZE_T written;
    return WriteProcessMemory(hProcess, (LPVOID)address, buffer, size, &written) && written == size;
}

uintptr_t Utils::PatternScan(HANDLE hProcess, uintptr_t start, size_t size, const char* sig, const char* mask) {
    std::vector<int> bytes;
    char* startPtr = (char*)sig;
    char* endPtr = startPtr + strlen(sig);

    for (char* current = startPtr; current < endPtr; ++current) {
        if (*current == '?') {
            bytes.push_back(-1);
        }
        else {
            bytes.push_back(strtoul(current, &current, 16));
        }
    }

    std::vector<char> buffer(size);
    SIZE_T read;
    if (!ReadProcessMemory(hProcess, (LPCVOID)start, buffer.data(), size, &read))
        return 0;

    for (size_t i = 0; i < size - bytes.size(); i++) {
        bool found = true;
        for (size_t j = 0; j < bytes.size(); j++) {
            if (bytes[j] != -1 && (unsigned char)buffer[i + j] != bytes[j]) {
                found = false;
                break;
            }
        }
        if (found) return start + i;
    }

    return 0;
}

uintptr_t Utils::PatternScan(HANDLE hProcess, uintptr_t start, size_t size, const char* sig) {
    // Generate mask from signature
    std::string mask;
    std::string cleanSig;

    char* temp = _strdup(sig);
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

    return PatternScan(hProcess, start, size, cleanSig.c_str(), mask.c_str());
}

bool Utils::InjectDLL(DWORD pid, const char* dllPath) {
    HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, pid);
    if (!hProcess) return false;

    // Allocate memory for DLL path
    SIZE_T pathLen = strlen(dllPath) + 1;
    LPVOID remotePath = VirtualAllocEx(hProcess, nullptr, pathLen, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
    if (!remotePath) {
        CloseHandle(hProcess);
        return false;
    }

    // Write DLL path
    if (!WriteProcessMemory(hProcess, remotePath, dllPath, pathLen, nullptr)) {
        VirtualFreeEx(hProcess, remotePath, 0, MEM_RELEASE);
        CloseHandle(hProcess);
        return false;
    }

    // Get LoadLibraryA address
    HMODULE hKernel32 = GetModuleHandleA("kernel32.dll");
    FARPROC loadLibrary = GetProcAddress(hKernel32, "LoadLibraryA");

    // Create remote thread
    HANDLE hThread = CreateRemoteThread(hProcess, nullptr, 0,
        (LPTHREAD_START_ROUTINE)loadLibrary, remotePath, 0, nullptr);

    if (!hThread) {
        VirtualFreeEx(hProcess, remotePath, 0, MEM_RELEASE);
        CloseHandle(hProcess);
        return false;
    }

    WaitForSingleObject(hThread, INFINITE);

    VirtualFreeEx(hProcess, remotePath, 0, MEM_RELEASE);
    CloseHandle(hThread);
    CloseHandle(hProcess);

    return true;
}

float Utils::DegreesToRadians(float degrees) {
    return degrees * (3.14159265f / 180.0f);
}

float Utils::RadiansToDegrees(float radians) {
    return radians * (180.0f / 3.14159265f);
}

float Utils::Clamp(float value, float min, float max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

bool Utils::IsKeyPressed(int vKey) {
    return (GetAsyncKeyState(vKey) & 1) != 0;
}

bool Utils::IsKeyDown(int vKey) {
    return (GetAsyncKeyState(vKey) & 0x8000) != 0;
}

DWORD Utils::GetTickCount() {
    return (DWORD)GetTickCount64();  // NEW - cast to DWORD
}

void Utils::Sleep(int ms) {
    ::Sleep(ms);
}