#pragma once
#include "GameStructs.h"
#include <vector>      // ADD THIS
#include <algorithm>   // ADD THIS

struct AimbotConfig {
    bool Enabled = true;
    bool SilentAim = false;          // Server-side hit registration
    bool MagicBullets = false;       // Bullets hit target regardless of aim
    bool FOVCheck = true;
    bool SmoothAim = true;
    bool TeamCheck = true;
    bool VisibleCheck = true;
    bool AutoFire = false;
    bool AutoWall = false;            // Shoot through walls

    float FOV = 30.0f;               // Field of view in degrees
    float Smoothness = 5.0f;         // Higher = smoother/slower
    float MaxDistance = 500.0f;      // Max lock-on distance
    int TargetBone = 0;              // 0 = head, 1 = neck, 2 = chest, etc.
    int Priority = 0;                // 0 = distance, 1 = health, 2 = threat

    bool DrawFOVCircle = true;
    float FOVColor[4] = { 1.0f, 1.0f, 1.0f, 0.5f };
};

struct AimTarget {
    CPed* Entity;
    Vector3 Position;
    Vector2 ScreenPosition;
    float Distance;
    float FOV;
    float Health;
};

class Aimbot {
public:
    static AimbotConfig Config;
    static CPed* CurrentTarget;
    static std::vector<AimTarget> Targets;  // ADD THIS

    static void Initialize();
    static void Update();
    static void Render();

    static Vector3 GetTargetBone(CPed* ped, int boneId);
    static float GetDistanceFOV(Vector2 screenPos);
    static bool IsTargetValid(AimTarget& target);

private:
    static void FindTargets();
    static AimTarget GetBestTarget();
    static void AimAt(AimTarget& target);
    static void SilentAim(AimTarget& target);
    static void MagicBullet(AimTarget& target);
    static Vector2 CalcAngle(Vector3 src, Vector3 dst);
    static void SmoothAim(Vector2& angle);
};