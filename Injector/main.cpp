#include <Windows.h>
#include <iostream>
#include <thread>
#include "Core.h"
#include "Memory.h"
#include "Utils.h"

// Configuration
#define FIVEM_PROCESS_NAME L"FiveM_GTAProcess.exe"
#define FIVEM_ALTERNATE_NAME L"FiveM.exe"

// Check if running as admin
bool IsRunningAsAdmin() {
    BOOL elevated = FALSE;
    HANDLE hToken = NULL;
    if (OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &hToken)) {
        TOKEN_ELEVATION elevation;
        DWORD size = sizeof(TOKEN_ELEVATION);
        if (GetTokenInformation(hToken, TokenElevation, &elevation, sizeof(elevation), &size)) {
            elevated = elevation.TokenIsElevated;
        }
        CloseHandle(hToken);
    }
    return elevated;
}

// Global handles for cleanup
HANDLE g_FiveMProcess = nullptr;

bool AttachToFiveM() {
    std::cout << "[*] Looking for FiveM process..." << std::endl;

    // Try main process name
    DWORD pid = Utils::GetProcessID(FIVEM_PROCESS_NAME);

    // Try alternate name
    if (pid == 0) {
        pid = Utils::GetProcessID(FIVEM_ALTERNATE_NAME);
    }

    // Try GTA5.exe (if launched directly)
    if (pid == 0) {
        pid = Utils::GetProcessID(L"GTA5.exe");
    }

    if (pid == 0) {
        std::cout << "[!] FiveM not found! Make sure FiveM is running." << std::endl;
        return false;
    }

    std::cout << "[+] Found FiveM (PID: " << pid << ")" << std::endl;

    // Initialize memory class
    if (!Memory::Initialize(FIVEM_PROCESS_NAME)) {
        std::cout << "[!] Failed to attach to process!" << std::endl;
        return false;
    }

    std::cout << "[+] Successfully attached to FiveM" << std::endl;
    std::cout << "[+] Base Address: 0x" << std::hex << Memory::BaseAddress << std::dec << std::endl;

    return true;
}

void PrintBanner() {
    std::cout << R"(
    ______ _           _____                       __    _____       _   
    |  ___| |         |_   _|                     /  |  |_   _|     | |  
    | |_  | | _____   __| | ___  _ __ ___   ___   `| |    | | _ __  | |_ 
    |  _| | |/ _ \ \ / / |/ _ \| '_ ` _ \ / _ \   | |    | || '_ \ | __|
    | |   | |  __/\ V /| | (_) | | | | | |  __/  _| |_  _| || | | || |_ 
    \_|   |_|\___| \_/ \_/\___/|_| |_| |_|\___|  \___/ \___/_| |_| \__|
                                                                         
    )" << std::endl;
    std::cout << "[+] FiveM Internal Cheat - 2026 Build" << std::endl;
    std::cout << "[+] Press INSERT to toggle menu" << std::endl;
    std::cout << "[+] Press DELETE to exit" << std::endl;
    std::cout << "----------------------------------------" << std::endl;
}

int main() {
    // Check admin rights
    if (!IsRunningAsAdmin()) {
        std::cout << "[!] Please run as Administrator!" << std::endl;
        system("pause");
        return 1;
    }

    // Hide console window (optional - comment out if you want to see debug output)
    // ShowWindow(GetConsoleWindow(), SW_HIDE);

    PrintBanner();

    // Wait for FiveM
    while (!AttachToFiveM()) {
        std::cout << "[*] Retrying in 3 seconds..." << std::endl;
        Sleep(3000);
    }

    // Initialize core systems
    if (!Core::Initialize()) {
        std::cout << "[!] Failed to initialize cheat!" << std::endl;
        system("pause");
        return 1;
    }

    std::cout << "[+] Cheat initialized successfully!" << std::endl;
    std::cout << "[+] Running..." << std::endl;

    // Main loop
    Core::Run();

    // Cleanup
    Core::Shutdown();
    Memory::Shutdown();

    std::cout << "[+] Cheat unloaded. Goodbye!" << std::endl;
    return 0;
}