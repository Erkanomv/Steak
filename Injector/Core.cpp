#include <Windows.h>
#include <cmath>
#include <vector>
#include <algorithm>
#include "Core.h"
#include "Memory.h"
#include "Offsets.h"
#include "ESP.h"
#include "Aimbot.h"
#include "Renderer.h"
#include "Input.h"
#include "Utils.h"
#include <iostream>

std::atomic<bool> Core::Running(false);
std::thread Core::ESPThreadHandle;
std::thread Core::AimbotThreadHandle;
std::thread Core::MiscThreadHandle;

bool Core::Initialize() {
    Running = true;

    // Update offsets first
    UpdateOffsets();

    // Initialize renderer (creates overlay)
    if (!Renderer::Initialize()) {
        std::cout << "[!] Failed to initialize renderer!" << std::endl;
        return false;
    }

    // Initialize features
    ESP::Initialize();
    Aimbot::Initialize();
    Input::Initialize();

    // Start threads
    ESPThreadHandle = std::thread(ESPThread);
    AimbotThreadHandle = std::thread(AimbotThread);
    MiscThreadHandle = std::thread(MiscThread);

    return true;
}

void Core::Shutdown() {
    Running = false;

    if (ESPThreadHandle.joinable()) ESPThreadHandle.join();
    if (AimbotThreadHandle.joinable()) AimbotThreadHandle.join();
    if (MiscThreadHandle.joinable()) MiscThreadHandle.join();

    Renderer::Shutdown();
}

void Core::Run() {
    while (Running) {
        // Check for exit key
        if (Input::IsKeyPressed(VK_DELETE)) {
            break;
        }

        // Toggle menu
        if (Input::IsKeyPressed(VK_INSERT)) {
            Renderer::ToggleMenu();
        }

        // Render frame
        Renderer::BeginFrame();

        // Draw ESP
        ESP::Render();

        // Draw Aimbot visuals
        Aimbot::Render();

        // Draw menu if open
        if (Renderer::IsMenuOpen()) {
            Renderer::DrawMenu();
        }

        Renderer::EndFrame();
        Renderer::Present();

        Input::Update();
        Sleep(1); // Prevent 100% CPU usage
    }
}

void Core::UpdateOffsets() {
    std::cout << "[*] Updating offsets..." << std::endl;

    Offsets::BaseAddress = Memory::BaseAddress;

    // Scan for World pointer
    uintptr_t worldPtr = Memory::PatternScan(Offsets::Sigs::World);
    if (worldPtr) {
        int32_t rel = Memory::Read<int32_t>(worldPtr + 3);
        Offsets::WorldPTR = worldPtr + rel + 7;
        std::cout << "[+] WorldPTR: 0x" << std::hex << Offsets::WorldPTR << std::dec << std::endl;
    }

    // Scan for ReplayInterface
    uintptr_t replayPtr = Memory::PatternScan(Offsets::Sigs::ReplayInterface);
    if (replayPtr) {
        int32_t rel = Memory::Read<int32_t>(replayPtr + 3);
        Offsets::ReplayInterface = replayPtr + rel + 7;
        std::cout << "[+] ReplayInterface: 0x" << std::hex << Offsets::ReplayInterface << std::dec << std::endl;
    }

    // Scan for ViewMatrix
    uintptr_t viewPtr = Memory::PatternScan(Offsets::Sigs::ViewMatrix);
    if (viewPtr) {
        int32_t rel = Memory::Read<int32_t>(viewPtr + 3);
        Offsets::ViewMatrix = viewPtr + rel + 7;
        std::cout << "[+] ViewMatrix: 0x" << std::hex << Offsets::ViewMatrix << std::dec << std::endl;
    }

    // Scan for Camera
    uintptr_t camPtr = Memory::PatternScan(Offsets::Sigs::Camera);
    if (camPtr) {
        int32_t rel = Memory::Read<int32_t>(camPtr + 3);
        Offsets::CameraPTR = camPtr + rel + 7;
        std::cout << "[+] CameraPTR: 0x" << std::hex << Offsets::CameraPTR << std::dec << std::endl;
    }

    // Get entity list from replay interface
    if (Offsets::ReplayInterface) {
        auto replay = Memory::Read<CReplayInterface*>(Offsets::ReplayInterface);
        if (replay) {
            Offsets::EntityList = (uintptr_t)replay->PedList;
            std::cout << "[+] EntityList: 0x" << std::hex << Offsets::EntityList << std::dec << std::endl;
        }
    }

    // Get local player from world
    if (Offsets::WorldPTR) {
        auto world = Memory::Read<CWorld*>(Offsets::WorldPTR);
        if (world) {
            Offsets::LocalPlayer = (uintptr_t)world->LocalPlayer;
            std::cout << "[+] LocalPlayer: 0x" << std::hex << Offsets::LocalPlayer << std::dec << std::endl;
        }
    }

    std::cout << "[+] Offsets updated!" << std::endl;
}

void Core::ESPThread() {
    while (Running) {
        ESP::UpdateEntities();
        Sleep(5); // Update at ~200 FPS
    }
}

void Core::AimbotThread() {
    while (Running) {
        Aimbot::Update();
        Sleep(1); // Very fast updates for aimbot
    }
}

void Core::MiscThread() {
    while (Running) {
        // Misc features like god mode, infinite ammo, etc.
        // Add your misc features here

        Sleep(10);
    }
}