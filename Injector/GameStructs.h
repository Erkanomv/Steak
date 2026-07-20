#pragma once
#include <Windows.h>
#include <cstdint>
#include <cmath>  // ADD THIS for sqrtf

struct Vector2 {
    float x, y;
    Vector2() : x(0), y(0) {}
    Vector2(float x, float y) : x(x), y(y) {}
};

struct Vector3 {
    float x, y, z;
    Vector3() : x(0), y(0), z(0) {}
    Vector3(float x, float y, float z) : x(x), y(y), z(z) {}

    Vector3 operator-(const Vector3& other) const {
        return Vector3(x - other.x, y - other.y, z - other.z);
    }

    Vector3 operator+(const Vector3& other) const {
        return Vector3(x + other.x, y + other.y, z + other.z);
    }

    float Distance(const Vector3& other) const {
        return sqrtf((x - other.x) * (x - other.x) +
            (y - other.y) * (y - other.y) +
            (z - other.z) * (z - other.z));
    }

    float Length() const {
        return sqrtf(x * x + y * y + z * z);
    }

    Vector3 Normalize() const {
        float len = Length();
        if (len == 0) return Vector3(0, 0, 0);
        return Vector3(x / len, y / len, z / len);
    }
};

struct Vector4 {
    float x, y, z, w;
};

struct Matrix4x4 {
    float m[4][4];
};

struct BoneMatrix {
    float pad[12];
    float x;
    float pad2[12];
    float y;
    float pad3[12];
    float z;
};

// Forward declarations
class CPlayerInfo;
class CWeaponManager;
class CVehicle;

class CPed {
public:
    char pad_0000[0x30];                    // 0x0000
    Vector3 Position;                       // 0x0030
    char pad_003C[0x244];                   // 0x003C
    float Health;                           // 0x0280
    float MaxHealth;                        // 0x0284
    char pad_0288[0x820];                   // 0x0288
    BoneMatrix* Bones;                      // 0x0AA8 (offset 0x460 from CPed)
    char pad_0AB0[0x508];                   // 0x0AB0
    CPlayerInfo* PlayerInfo;                // 0x0FB8 (offset 0x10B8)
    char pad_0FC0[0x118];                   // 0x0FC0
    CWeaponManager* WeaponManager;          // 0x10D8
    char pad_10E0[0x400];                   // 0x10E0
    CVehicle* CurrentVehicle;               // 0x14E8
    char pad_14F0[0xE0];                    // 0x14F0
    int32_t IsInVehicle;                    // 0x15D0
    char pad_15D4[0x4C];                    // 0x15D4
    int32_t EntityType;                     // 0x1620

    Vector3 GetBonePosition(int boneId);
    bool IsValid();
    bool IsPlayer();
    bool IsNPC();
    bool IsDead();
};

class CPlayerInfo {
public:
    char pad_0000[0xA8];                    // 0x0000
    char* Name;                             // 0x00A8
    char pad_00B0[0x8C];                    // 0x00B0
    int32_t PlayerID;                       // 0x013C
    char pad_0140[0x748];                   // 0x0140
    int32_t WantedLevel;                    // 0x0888

    char* GetName();
};

class CWeaponInfo {
public:
    char pad_0000[0x7C];                    // 0x0000
    float Spread;                           // 0x007C
    char pad_0080[0x28C];                   // 0x0080
    float Damage;                           // 0x030C
    char pad_0310[0x44];                    // 0x0310
    float ReloadTimeMultiplier;           // 0x0354
};

class CWeapon {
public:
    char pad_0000[0x20];                    // 0x0000
    CWeaponInfo* Info;                      // 0x0020
};

class CWeaponManager {
public:
    char pad_0000[0x20];                    // 0x0000
    CWeapon* CurrentWeapon;                 // 0x0020
};

class CVehicle {
public:
    char pad_0000[0x908];                   // 0x0000
    float Health;                           // 0x0908
    float EngineHealth;                     // 0x090C
    char pad_0910[0x34C];                   // 0x0910
    float Gravity;                          // 0x0C5C
};

class CEntityList {
public:
    char pad_0000[0x180];                   // 0x0000
    CPed* Entities[256];                    // 0x0180 (max 256 entities)
    int32_t Count;                          // 0x0580
};

class CWorld {
public:
    char pad_0000[0x8];                     // 0x0000
    CPed* LocalPlayer;                      // 0x0008
};

class CReplayInterface {
public:
    char pad_0000[0x18];                    // 0x0000
    CEntityList* PedList;                   // 0x0018
    CEntityList* VehicleList;                 // 0x0020
    CEntityList* PickupList;                  // 0x0028
    CEntityList* ObjectList;                  // 0x0030
};