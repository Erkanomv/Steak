#pragma once
#include <Windows.h>
#include <cstdint>

// Current FiveM Offsets (b3258 - July 2026)
namespace Offsets {
    // Signatures to scan for (these work across updates)
    namespace Sigs {
        inline const char* World = "48 8B 05 ? ? ? ? 45 0F C6 C9";
        inline const char* ReplayInterface = "48 8D 0D ? ? ? ? 48 8B D7 E8 ? ? ? ? 48 8D 0D ? ? ? ? 8A D8";
        inline const char* ViewMatrix = "48 8D 0D ? ? ? ? 48 C1 E0 06 48 03 C1 C3";
        inline const char* Camera = "48 8B 05 ? ? ? ? 48 8B 98 ? ? ? ? EB";
        inline const char* EntityList = "48 8B 0D ? ? ? ? 44 8B C6 8B D3 48 8B 01 FF 90";
        inline const char* PlayerList = "48 8B 0D ? ? ? ? E8 ? ? ? ? 48 8B C8 E8 ? ? ? ? 48 8B C6";
        inline const char* BoneMatrix = "48 8D 15 ? ? ? ? 48 89 51 ? 48 89 51";
    }

    // Hardcoded offsets (these change less often)
    namespace Ped {
        constexpr uint32_t Health = 0x280;
        constexpr uint32_t MaxHealth = 0x284;
        constexpr uint32_t Position = 0x30;
        constexpr uint32_t BoneMatrix = 0x460;
        constexpr uint32_t PlayerInfo = 0x10B8;
        constexpr uint32_t WeaponManager = 0x10D8;
        constexpr uint32_t IsInVehicle = 0x14E0;
        constexpr uint32_t CurrentVehicle = 0x14E8;
        constexpr uint32_t Armor = 0x14B0;
        constexpr uint32_t Ragdoll = 0x10B0;
        constexpr uint32_t EntityType = 0x2A;  // ADD THIS
    }

    namespace PlayerInfo {
        constexpr uint32_t Name = 0xA8;
        constexpr uint32_t PlayerID = 0x8C;
        constexpr uint32_t WantedLevel = 0x888;
        constexpr uint32_t RunSpeed = 0x18C;
        constexpr uint32_t SwimSpeed = 0x194;
    }

    namespace Weapon {
        constexpr uint32_t CurrentWeapon = 0x20;
        constexpr uint32_t WeaponInfo = 0x0;
        constexpr uint32_t Spread = 0x7C;
        constexpr uint32_t Recoil = 0x30C;
        constexpr uint32_t Damage = 0xBC;
        constexpr uint32_t Range = 0x28C;
        constexpr uint32_t ReloadMultiplier = 0x134;
        constexpr uint32_t AmmoType = 0x24;
    }

    namespace Vehicle {
        constexpr uint32_t Health = 0x908;
        constexpr uint32_t EngineHealth = 0x90C;
        constexpr uint32_t Gravity = 0xC5C;
        constexpr uint32_t Boost = 0x48;
    }

    namespace Entity {
        constexpr uint32_t ModelInfo = 0x20;
        constexpr uint32_t EntityType = 0x2A;
        constexpr uint32_t Visible = 0xAC;
    }

    // Runtime offsets (set by OffsetUpdater)
    inline uintptr_t BaseAddress = 0;
    inline uintptr_t WorldPTR = 0;
    inline uintptr_t ReplayInterface = 0;
    inline uintptr_t ViewMatrix = 0;
    inline uintptr_t CameraPTR = 0;
    inline uintptr_t EntityList = 0;
    inline uintptr_t LocalPlayer = 0;  // ADD THIS
    inline uintptr_t PlayerList = 0;
}