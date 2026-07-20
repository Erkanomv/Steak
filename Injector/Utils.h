#pragma once
#include <Windows.h>
#include <string>
#include <vector>
#include <TlHelp32.h>
#include <Psapi.h>

class Utils {
public:
    // String
    static std::string WStringToString(const std::wstring& wstr);
    static std::wstring StringToWString(const std::string& str);
    static std::string Format(const char* fmt, ...);

    // Math
    static float DegreesToRadians(float degrees);
    static float RadiansToDegrees(float radians);
    static float Clamp(float value, float min, float max);

    // Process
    static DWORD GetProcessID(const wchar_t* processName);
    static uintptr_t GetModuleBaseAddress(DWORD pid, const wchar_t* moduleName);
    static bool IsProcessRunning(DWORD pid);

    // Memory
    static bool ReadMemory(HANDLE hProcess, uintptr_t address, void* buffer, size_t size);
    static bool WriteMemory(HANDLE hProcess, uintptr_t address, void* buffer, size_t size);

    // Pattern
    static uintptr_t PatternScan(HANDLE hProcess, uintptr_t start, size_t size, const char* sig, const char* mask);
    static uintptr_t PatternScan(HANDLE hProcess, uintptr_t start, size_t size, const char* sig);

    // Injection
    static bool ManualMap(HANDLE hProcess, const char* dllPath);
    static bool InjectDLL(DWORD pid, const char* dllPath);

    // Input
    static bool IsKeyPressed(int vKey);
    static bool IsKeyJustPressed(int vKey);
    static bool IsKeyDown(int vKey);  // ADD THIS

    // Time
    static DWORD GetTickCount();
    static void Sleep(int ms);
};