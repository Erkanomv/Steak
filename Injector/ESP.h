#pragma once
#include "GameStructs.h"
#include <vector>

struct ESPConfig {
    bool Enabled = true;
    bool Box = true;
    bool Skeleton = true;
    bool HealthBar = true;
    bool HeadCircle = true;
    bool Name = true;
    bool Distance = true;
    bool Weapon = true;
    bool Tracers = false;
    bool TeamCheck = true;
    bool VisibleCheck = true;

    // Colors (RGBA)
    float BoxColor[4] = { 1.0f, 0.0f, 0.0f, 1.0f };
    float SkeletonColor[4] = { 0.0f, 1.0f, 0.0f, 1.0f };
    float VisibleColor[4] = { 0.0f, 1.0f, 0.0f, 1.0f };
    float InvisibleColor[4] = { 1.0f, 0.0f, 0.0f, 1.0f };
    float TeamColor[4] = { 0.0f, 0.0f, 1.0f, 1.0f };
    float EnemyColor[4] = { 1.0f, 0.0f, 0.0f, 1.0f };
};

struct EntityESP {
    CPed* Entity;
    Vector3 Position;
    Vector3 HeadPosition;
    Vector2 ScreenPos;
    Vector2 HeadScreenPos;
    float Distance;
    bool IsVisible;
    bool IsPlayer;
    char Name[64];
    float Health;
    float MaxHealth;
    bool IsInVehicle;
};

class ESP {
public:
    static ESPConfig Config;

    static void Initialize();
    static void Render();
    static void UpdateEntities();

private:
    static std::vector<EntityESP> Entities;

    static bool WorldToScreen(Vector3 worldPos, Vector2& screenPos);
    static void DrawBox(EntityESP& entity);
    static void DrawSkeleton(EntityESP& entity);
    static void DrawHealthBar(EntityESP& entity);
    static void DrawHeadCircle(EntityESP& entity);
    static void DrawName(EntityESP& entity);
    static void DrawTracers(EntityESP& entity);
    static bool IsEntityVisible(CPed* ped);
    static Vector3 GetHeadPosition(CPed* ped);
};