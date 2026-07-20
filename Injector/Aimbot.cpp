#include <Windows.h>
#include <cmath>
#include <vector>
#include <algorithm>
#include "Aimbot.h"
#include "Memory.h"
#include "Offsets.h"
#include "Renderer.h"
#include "Input.h"
#include "ESP.h"
#include <cmath>

AimbotConfig Aimbot::Config;
CPed* Aimbot::CurrentTarget = nullptr;
std::vector<AimTarget> Aimbot::Targets;

void Aimbot::Initialize() {
    // Config already default-initialized
}

void Aimbot::Update() {
    if (!Config.Enabled) {
        CurrentTarget = nullptr;
        return;
    }

    FindTargets();

    if (Targets.empty()) {
        CurrentTarget = nullptr;
        return;
    }

    auto bestTarget = GetBestTarget();
    if (bestTarget.Entity) {
        CurrentTarget = bestTarget.Entity;

        if (Config.SilentAim) {
            SilentAim(bestTarget);
        }
        else if (Config.MagicBullets) {
            MagicBullet(bestTarget);
        }
        else {
            AimAt(bestTarget);
        }
    }
}

void Aimbot::Render() {
    if (!Config.Enabled) return;

    // Draw FOV circle
    if (Config.DrawFOVCircle) {
        Renderer::DrawCircle(Renderer::ScreenWidth / 2, Renderer::ScreenHeight / 2,
            Config.FOV * 10, Config.FOVColor);
    }

    // Draw target lock indicator
    if (CurrentTarget) {
        float green[4] = { 0, 1, 0, 1 };
        Renderer::DrawText("[LOCKED]", Renderer::ScreenWidth / 2 - 30, Renderer::ScreenHeight / 2 - 50, 14, green);
    }
}

Vector3 Aimbot::GetTargetBone(CPed* ped, int boneId) {
    auto boneMatrix = Memory::Read<BoneMatrix*>((uintptr_t)ped + Offsets::Ped::BoneMatrix);
    if (!boneMatrix) {
        Vector3 pos = Memory::Read<Vector3>((uintptr_t)ped + Offsets::Ped::Position);
        pos.z += 0.8f;
        return pos;
    }

    // Common bones: 0=head, 1=neck, 2=chest, 3=spine
    return Vector3(boneMatrix[boneId].x, boneMatrix[boneId].y, boneMatrix[boneId].z);
}

float Aimbot::GetDistanceFOV(Vector2 screenPos) {
    float dx = screenPos.x - Renderer::ScreenWidth / 2;
    float dy = screenPos.y - Renderer::ScreenHeight / 2;
    return sqrtf(dx * dx + dy * dy);
}

bool Aimbot::IsTargetValid(AimTarget& target) {
    if (!target.Entity) return false;

    // Check health
    if (target.Health <= 0 || target.Health > 1000) return false;

    // Check distance
    if (target.Distance > Config.MaxDistance) return false;

    // Check FOV
    if (Config.FOVCheck) {
        float fovDist = GetDistanceFOV(target.ScreenPosition);
        if (fovDist > Config.FOV * 10) return false; // Scale FOV
    }

    // Check visibility
    if (Config.VisibleCheck) {
        int visible = Memory::Read<int>((uintptr_t)target.Entity + Offsets::Entity::Visible);
        if (visible <= 0) return false;
    }

    return true;
}

void Aimbot::FindTargets() {
    Targets.clear();

    if (!Offsets::EntityList) return;

    auto entityList = Memory::Read<CEntityList*>(Offsets::EntityList);
    if (!entityList) return;

    auto localPlayer = Memory::Read<CPed*>(Offsets::LocalPlayer);
    if (!localPlayer) return;

    Vector3 localPos = Memory::Read<Vector3>((uintptr_t)localPlayer + Offsets::Ped::Position);

    for (int i = 0; i < 256; i++) {
        auto entity = entityList->Entities[i];
        if (!entity) continue;
        if ((uintptr_t)entity == Offsets::LocalPlayer) continue;

        int entityType = Memory::Read<int>((uintptr_t)entity + Offsets::Ped::EntityType);
        if (entityType != 1) continue;

        AimTarget target;
        target.Entity = entity;
        target.Position = GetTargetBone(entity, Config.TargetBone);
        target.Health = Memory::Read<float>((uintptr_t)entity + Offsets::Ped::Health);
        target.Distance = localPos.Distance(target.Position);

        // World to screen
        // (Simplified - you'd use the same W2S as ESP)
        // For now, skip if not on screen

        if (IsTargetValid(target)) {
            Targets.push_back(target);
        }
    }
}

AimTarget Aimbot::GetBestTarget() {
    if (Targets.empty()) return { nullptr, Vector3(), Vector2(), 0, 0, 0 };

    // Sort by priority
    switch (Config.Priority) {
    case 0: // Distance
        std::sort(Targets.begin(), Targets.end(), [](const AimTarget& a, const AimTarget& b) {
            return a.Distance < b.Distance;
            });
        break;
    case 1: // Health
        std::sort(Targets.begin(), Targets.end(), [](const AimTarget& a, const AimTarget& b) {
            return a.Health < b.Health;
            });
        break;
    case 2: // FOV
        std::sort(Targets.begin(), Targets.end(), [](const AimTarget& a, const AimTarget& b) {
            return a.FOV < b.FOV;
            });
        break;
    }

    return Targets[0];
}

void Aimbot::AimAt(AimTarget& target) {
    // Get current camera rotation
    if (!Offsets::CameraPTR) return;

    auto cam = Memory::Read<uintptr_t>(Offsets::CameraPTR);
    if (!cam) return;

    // Calculate angle to target
    Vector3 localPos = Memory::Read<Vector3>(Offsets::LocalPlayer + Offsets::Ped::Position);
    localPos.z += 0.8f; // Eye level

    Vector2 angle = CalcAngle(localPos, target.Position);

    // Apply smoothing
    if (Config.SmoothAim) {
        SmoothAim(angle);
    }

    // Write new view angles (simplified - actual implementation depends on camera structure)
    // Memory::Write<Vector2>(cam + 0x40, angle);

    // Auto fire
    if (Config.AutoFire) {
        // Simulate left mouse click
        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
        Sleep(10);
        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
    }
}

void Aimbot::SilentAim(AimTarget& target) {
    // Silent aim modifies bullet trajectory server-side
    // This requires hooking weapon fire functions or modifying bullet spawn

    auto localPlayer = (CPed*)Offsets::LocalPlayer;
    if (!localPlayer) return;

    auto weaponMgr = Memory::Read<CWeaponManager*>((uintptr_t)localPlayer + Offsets::Ped::WeaponManager);
    if (!weaponMgr) return;

    auto weapon = weaponMgr->CurrentWeapon;
    if (!weapon) return;

    auto weaponInfo = weapon->Info;
    if (!weaponInfo) return;

    // Modify bullet spread to 0 (perfect accuracy)
    Memory::Write<float>((uintptr_t)weaponInfo + Offsets::Weapon::Spread, 0.0f);

    // Modify damage
    Memory::Write<float>((uintptr_t)weaponInfo + Offsets::Weapon::Damage, 999.0f);

    // Modify range
    Memory::Write<float>((uintptr_t)weaponInfo + Offsets::Weapon::Range, 9999.0f);

    // Set target position in bullet spawn (this is where silent aim magic happens)
    // You'd hook the bullet creation function and modify destination
}

void Aimbot::MagicBullet(AimTarget& target) {
    // Magic bullets teleport to target
    // This is done by modifying bullet position each frame

    // Similar to silent aim but more aggressive
    // Forces bullets to hit target regardless of aim

    // Implementation would involve:
    // 1. Hooking bullet update function
    // 2. Checking if bullet is owned by local player
    // 3. Teleporting bullet to target position

    // For now, use silent aim as base
    SilentAim(target);
}

Vector2 Aimbot::CalcAngle(Vector3 src, Vector3 dst) {
    Vector2 angle;
    Vector3 delta = dst - src;

    float hyp = sqrtf(delta.x * delta.x + delta.y * delta.y);
    angle.x = atan2f(delta.y, delta.x) * (180.0f / 3.14159265f);
    angle.y = atan2f(delta.z, hyp) * (180.0f / 3.14159265f);

    return angle;
}

void Aimbot::SmoothAim(Vector2& angle) {
    // Get current angle (simplified)
    Vector2 currentAngle; // = GetCurrentAngle();

    // Interpolate
    angle.x = currentAngle.x + (angle.x - currentAngle.x) / Config.Smoothness;
    angle.y = currentAngle.y + (angle.y - currentAngle.y) / Config.Smoothness;
}