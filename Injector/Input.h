#pragma once
#include <Windows.h>

class Input {
public:
    static void Initialize();
    static void Update();

    static bool IsKeyDown(int vKey);
    static bool IsKeyPressed(int vKey);      // Just pressed this frame
    static bool IsKeyReleased(int vKey);     // Just released this frame

    static void GetMousePos(int& x, int& y);
    static void SetMousePos(int x, int y);
    static void GetMouseDelta(int& dx, int& dy);

private:
    static bool CurrentKeys[256];
    static bool PreviousKeys[256];
    static int MouseX, MouseY;
    static int LastMouseX, LastMouseY;
};