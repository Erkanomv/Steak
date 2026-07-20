#pragma once
#include <Windows.h>
#include <thread>
#include <atomic>

class Core {
public:
    static bool Initialize();
    static void Shutdown();
    static void Run();

    static bool IsRunning() { return Running; }
    static void Stop() { Running = false; }

    // Features
    static void UpdateOffsets();
    static void ESPThread();
    static void AimbotThread();
    static void MiscThread();

private:
    static std::atomic<bool> Running;
    static std::thread ESPThreadHandle;
    static std::thread AimbotThreadHandle;
    static std::thread MiscThreadHandle;
};