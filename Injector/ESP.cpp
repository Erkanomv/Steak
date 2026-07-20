#include <Windows.h>
#include <cmath>
#include <vector>
#include <algorithm>
#include "ESP.h"
#include "Memory.h"
#include "Offsets.h"
#include "Renderer.h"
#include "GameStructs.h"
#include <algorithm>

ESPConfig ESP::Config;
std::vector<EntityESP> ESP::Entities;

void ESP::Initialize() {
    // Config is already default-initialized
}

void ESP::UpdateEntities() {
    Entities.clear();

    if (!Offsets::EntityList) return;

    // Read entity list
    auto entityList = Memory::Read<CEntityList*>(Offsets::EntityList);
    if (!entityList) return;

    // Get local player
    auto localPlayer = Memory::Read<CPed*>(Offsets::LocalPlayer);
    if (!localPlayer) return;

    Vector3 localPos = Memory::Read<Vector3>((uintptr_t)localPlayer + Offsets::Ped::Position);

    // Iterate through entities
    for (int i = 0; i < 256; i++) {
        auto entity = entityList->Entities[i];
        if (!entity) continue;

        // Skip local player
        if ((uintptr_t)entity == Offsets::LocalPlayer) continue;

        // Check if valid ped
        int entityType = Memory::Read<int>((uintptr_t)entity + Offsets::Ped::EntityType);
        if (entityType != 1) continue; // 1 = ped

        EntityESP espData;
        espData.Entity = entity;
        espData.Position = Memory::Read<Vector3>((uintptr_t)entity + Offsets::Ped::Position);
        espData.HeadPosition = GetHeadPosition(entity);
        espData.Health = Memory::Read<float>((uintptr_t)entity + Offsets::Ped::Health);
        espData.MaxHealth = Memory::Read<float>((uintptr_t)entity + Offsets::Ped::MaxHealth);
        espData.Distance = localPos.Distance(espData.Position);
        espData.IsInVehicle = Memory::Read<int>((uintptr_t)entity + Offsets::Ped::IsInVehicle) != 0;

        // Get player info
        auto playerInfo = Memory::Read<CPlayerInfo*>((uintptr_t)entity + Offsets::Ped::PlayerInfo);
        if (playerInfo) {
            espData.IsPlayer = true;
            char* name = Memory::Read<char*>((uintptr_t)playerInfo + Offsets::PlayerInfo::Name);
            if (name) {
                Memory::ReadBuffer((uintptr_t)name, espData.Name, 64);
            }
            else {
                strcpy_s(espData.Name, "NPC");
            }
        }
        else {
            espData.IsPlayer = false;
            strcpy_s(espData.Name, "NPC");
        }

        // World to screen
        if (WorldToScreen(espData.Position, espData.ScreenPos) &&
            WorldToScreen(espData.HeadPosition, espData.HeadScreenPos)) {
            espData.IsVisible = IsEntityVisible(entity);
            Entities.push_back(espData);
        }
    }

    // Sort by distance (closest last = drawn on top)
    std::sort(Entities.begin(), Entities.end(), [](const EntityESP& a, const EntityESP& b) {
        return a.Distance > b.Distance;
        });
}

void ESP::Render() {
    if (!Config.Enabled) return;

    for (auto& entity : Entities) {
        // Skip if team check enabled and same team (simplified)
        if (Config.TeamCheck && !entity.IsPlayer) continue;

        // Skip if visible check enabled and not visible
        if (Config.VisibleCheck && !entity.IsVisible) continue;

        // Choose color
        float* color = Config.EnemyColor;
        if (Config.VisibleCheck && entity.IsVisible) {
            color = Config.VisibleColor;
        }

        if (Config.Box) DrawBox(entity);
        if (Config.Skeleton) DrawSkeleton(entity);
        if (Config.HealthBar) DrawHealthBar(entity);
        if (Config.HeadCircle) DrawHeadCircle(entity);
        if (Config.Name) DrawName(entity);
        if (Config.Tracers) DrawTracers(entity);
    }
}

bool ESP::WorldToScreen(Vector3 worldPos, Vector2& screenPos) {
    if (!Offsets::ViewMatrix) return false;

    // Read view matrix
    Matrix4x4 matrix = Memory::Read<Matrix4x4>(Offsets::ViewMatrix);

    // Transform
    Vector4 clipCoords;
    clipCoords.x = worldPos.x * matrix.m[0][0] + worldPos.y * matrix.m[1][0] + worldPos.z * matrix.m[2][0] + matrix.m[3][0];
    clipCoords.y = worldPos.x * matrix.m[0][1] + worldPos.y * matrix.m[1][1] + worldPos.z * matrix.m[2][1] + matrix.m[3][1];
    clipCoords.z = worldPos.x * matrix.m[0][2] + worldPos.y * matrix.m[1][2] + worldPos.z * matrix.m[2][2] + matrix.m[3][2];
    clipCoords.w = worldPos.x * matrix.m[0][3] + worldPos.y * matrix.m[1][3] + worldPos.z * matrix.m[2][3] + matrix.m[3][3];

    if (clipCoords.w < 0.1f) return false;

    Vector3 NDC;
    NDC.x = clipCoords.x / clipCoords.w;
    NDC.y = clipCoords.y / clipCoords.w;
    NDC.z = clipCoords.z / clipCoords.w;

    screenPos.x = (Renderer::ScreenWidth / 2 * NDC.x) + (NDC.x + Renderer::ScreenWidth / 2);
    screenPos.y = -(Renderer::ScreenHeight / 2 * NDC.y) + (NDC.y + Renderer::ScreenHeight / 2);

    return true;
}

void ESP::DrawBox(EntityESP& entity) {
    float height = abs(entity.HeadScreenPos.y - entity.ScreenPos.y);
    float width = height / 2.0f;

    float x = entity.ScreenPos.x - width / 2;
    float y = entity.HeadScreenPos.y;

    float* color = entity.IsVisible ? Config.VisibleColor : Config.BoxColor;
    Renderer::DrawBox(x, y, width, height, color, 1.0f);
}

void ESP::DrawSkeleton(EntityESP& entity) {
    // Bone IDs for GTA V
    const int HEAD = 0;
    const int NECK = 1;
    const int SPINE = 2;
    const int PELVIS = 3;
    const int L_SHOULDER = 4;
    const int L_ELBOW = 5;
    const int L_HAND = 6;
    const int R_SHOULDER = 7;
    const int R_ELBOW = 8;
    const int R_HAND = 9;
    const int L_HIP = 10;
    const int L_KNEE = 11;
    const int L_FOOT = 12;
    const int R_HIP = 13;
    const int R_KNEE = 14;
    const int R_FOOT = 15;

    // Get bone matrix
    auto boneMatrix = Memory::Read<BoneMatrix*>((uintptr_t)entity.Entity + Offsets::Ped::BoneMatrix);
    if (!boneMatrix) return;

    // Read bone positions
    Vector3 bones[16];
    for (int i = 0; i < 16; i++) {
        bones[i].x = boneMatrix[i].x;
        bones[i].y = boneMatrix[i].y;
        bones[i].z = boneMatrix[i].z;
    }

    // Draw lines between bones
    Vector2 screenPoints[16];
    bool valid[16] = { false };

    for (int i = 0; i < 16; i++) {
        valid[i] = WorldToScreen(bones[i], screenPoints[i]);
    }

    float* color = Config.SkeletonColor;

    // Spine
    if (valid[HEAD] && valid[NECK]) Renderer::DrawLine(screenPoints[HEAD].x, screenPoints[HEAD].y, screenPoints[NECK].x, screenPoints[NECK].y, color);
    if (valid[NECK] && valid[SPINE]) Renderer::DrawLine(screenPoints[NECK].x, screenPoints[NECK].y, screenPoints[SPINE].x, screenPoints[SPINE].y, color);
    if (valid[SPINE] && valid[PELVIS]) Renderer::DrawLine(screenPoints[SPINE].x, screenPoints[SPINE].y, screenPoints[PELVIS].x, screenPoints[PELVIS].y, color);

    // Left arm
    if (valid[NECK] && valid[L_SHOULDER]) Renderer::DrawLine(screenPoints[NECK].x, screenPoints[NECK].y, screenPoints[L_SHOULDER].x, screenPoints[L_SHOULDER].y, color);
    if (valid[L_SHOULDER] && valid[L_ELBOW]) Renderer::DrawLine(screenPoints[L_SHOULDER].x, screenPoints[L_SHOULDER].y, screenPoints[L_ELBOW].x, screenPoints[L_ELBOW].y, color);
    if (valid[L_ELBOW] && valid[L_HAND]) Renderer::DrawLine(screenPoints[L_ELBOW].x, screenPoints[L_ELBOW].y, screenPoints[L_HAND].x, screenPoints[L_HAND].y, color);

    // Right arm
    if (valid[NECK] && valid[R_SHOULDER]) Renderer::DrawLine(screenPoints[NECK].x, screenPoints[NECK].y, screenPoints[R_SHOULDER].x, screenPoints[R_SHOULDER].y, color);
    if (valid[R_SHOULDER] && valid[R_ELBOW]) Renderer::DrawLine(screenPoints[R_SHOULDER].x, screenPoints[R_SHOULDER].y, screenPoints[R_ELBOW].x, screenPoints[R_ELBOW].y, color);
    if (valid[R_ELBOW] && valid[R_HAND]) Renderer::DrawLine(screenPoints[R_ELBOW].x, screenPoints[R_ELBOW].y, screenPoints[R_HAND].x, screenPoints[R_HAND].y, color);

    // Left leg
    if (valid[PELVIS] && valid[L_HIP]) Renderer::DrawLine(screenPoints[PELVIS].x, screenPoints[PELVIS].y, screenPoints[L_HIP].x, screenPoints[L_HIP].y, color);
    if (valid[L_HIP] && valid[L_KNEE]) Renderer::DrawLine(screenPoints[L_HIP].x, screenPoints[L_HIP].y, screenPoints[L_KNEE].x, screenPoints[L_KNEE].y, color);
    if (valid[L_KNEE] && valid[L_FOOT]) Renderer::DrawLine(screenPoints[L_KNEE].x, screenPoints[L_KNEE].y, screenPoints[L_FOOT].x, screenPoints[L_FOOT].y, color);

    // Right leg
    if (valid[PELVIS] && valid[R_HIP]) Renderer::DrawLine(screenPoints[PELVIS].x, screenPoints[PELVIS].y, screenPoints[R_HIP].x, screenPoints[R_HIP].y, color);
    if (valid[R_HIP] && valid[R_KNEE]) Renderer::DrawLine(screenPoints[R_HIP].x, screenPoints[R_HIP].y, screenPoints[R_KNEE].x, screenPoints[R_KNEE].y, color);
    if (valid[R_KNEE] && valid[R_FOOT]) Renderer::DrawLine(screenPoints[R_KNEE].x, screenPoints[R_KNEE].y, screenPoints[R_FOOT].x, screenPoints[R_FOOT].y, color);
}

void ESP::DrawHealthBar(EntityESP& entity) {
    float height = abs(entity.HeadScreenPos.y - entity.ScreenPos.y);
    float width = height / 2.0f;
    float barWidth = 4.0f;

    float x = entity.ScreenPos.x - width / 2 - barWidth - 2;
    float y = entity.HeadScreenPos.y;

    float healthPercent = entity.Health / entity.MaxHealth;
    if (healthPercent > 1.0f) healthPercent = 1.0f;
    if (healthPercent < 0.0f) healthPercent = 0.0f;

    float barHeight = height * healthPercent;

    // Background (black)
    float black[4] = { 0, 0, 0, 1 };
    Renderer::DrawFilledBox(x, y, barWidth, height, black);

    // Health (green to red)
    float healthColor[4] = { 1.0f - healthPercent, healthPercent, 0, 1 };
    Renderer::DrawFilledBox(x, y + height - barHeight, barWidth, barHeight, healthColor);
}

void ESP::DrawHeadCircle(EntityESP& entity) {
    float radius = 8.0f;
    float* color = Config.VisibleColor;

    Renderer::DrawCircle(entity.HeadScreenPos.x, entity.HeadScreenPos.y, radius, color);
}

void ESP::DrawName(EntityESP& entity) {
    float color[4] = { 1.0f, 1.0f, 1.0f, 1.0f };
    char text[128];
    sprintf_s(text, "%s [%dm]", entity.Name, (int)entity.Distance);

    Renderer::DrawText(text, entity.HeadScreenPos.x, entity.HeadScreenPos.y - 20, 12, color);
}

void ESP::DrawTracers(EntityESP& entity) {
    float* color = Config.BoxColor;
    Renderer::DrawLine(Renderer::ScreenWidth / 2, Renderer::ScreenHeight, entity.ScreenPos.x, entity.ScreenPos.y, color);
}

bool ESP::IsEntityVisible(CPed* ped) {
    // Simple visibility check - can be improved with raycasting
    int visible = Memory::Read<int>((uintptr_t)ped + Offsets::Entity::Visible);
    return visible > 0;
}

Vector3 ESP::GetHeadPosition(CPed* ped) {
    auto boneMatrix = Memory::Read<BoneMatrix*>((uintptr_t)ped + Offsets::Ped::BoneMatrix);
    if (!boneMatrix) {
        Vector3 pos = Memory::Read<Vector3>((uintptr_t)ped + Offsets::Ped::Position);
        pos.z += 0.8f; // Approximate head height
        return pos;
    }

    // Head bone is index 0
    return Vector3(boneMatrix[0].x, boneMatrix[0].y, boneMatrix[0].z);
}