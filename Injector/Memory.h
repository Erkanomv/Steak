#pragma once
#include <Windows.h>
#include <cstdint>
#include <TlHelp32.h>
#include <vector>
#include <string>
#include <Psapi.h>   // ADD THIS for MODULEINFO

class Memory {
public:
    static HANDLE ProcessHandle;
    static uintptr_t BaseAddress;
    static DWORD ProcessID;

    // Initialization
    static bool Initialize(const wchar_t* processName);
    static void Shutdown();

    // Basic read/write
    template<typename T>
    static T Read(uintptr_t address) {
        T value = {};
        ReadProcessMemory(ProcessHandle, (LPCVOID)address, &value, sizeof(T), nullptr);
        return value;
    }

    template<typename T>
    static void Write(uintptr_t address, T value) {
        WriteProcessMemory(ProcessHandle, (LPVOID)address, &value, sizeof(T), nullptr);
    }

    static void ReadBuffer(uintptr_t address, void* buffer, size_t size);
    static void WriteBuffer(uintptr_t address, void* buffer, size_t size);

    // Pointer chains
    static uintptr_t ReadPointer(uintptr_t address, std::vector<unsigned int> offsets);

    // Pattern scanning
    static uintptr_t PatternScan(const char* signature, const char* mask);
    static uintptr_t PatternScan(const char* signature);
    static uintptr_t GetModuleBase(const wchar_t* moduleName);

    // Memory protection
    static void SetMemoryProtection(uintptr_t address, size_t size, DWORD protection);

private:
    static std::vector<int> PatternToByte(const char* pattern);
};