#include <Windows.h>
#include <cmath>
#include <vector>
#include <algorithm>
#include "Input.h"

bool Input::CurrentKeys[256] = { false };
bool Input::PreviousKeys[256] = { false };
int Input::MouseX = 0;
int Input::MouseY = 0;
int Input::LastMouseX = 0;
int Input::LastMouseY = 0;

void Input::Initialize() {
    // Initialize key states
    for (int i = 0; i < 256; i++) {
        CurrentKeys[i] = false;
        PreviousKeys[i] = false;
    }
}

void Input::Update() {
    // Save previous states
    for (int i = 0; i < 256; i++) {
        PreviousKeys[i] = CurrentKeys[i];
    }

    // Update current states
    for (int i = 0; i < 256; i++) {
        CurrentKeys[i] = (GetAsyncKeyState(i) & 0x8000) != 0;
    }

    // Update mouse
    LastMouseX = MouseX;
    LastMouseY = MouseY;
    POINT pt;
    GetCursorPos(&pt);
    MouseX = pt.x;
    MouseY = pt.y;
}

bool Input::IsKeyDown(int vKey) {
    if (vKey < 0 || vKey >= 256) return false;
    return CurrentKeys[vKey];
}

bool Input::IsKeyPressed(int vKey) {
    if (vKey < 0 || vKey >= 256) return false;
    return CurrentKeys[vKey] && !PreviousKeys[vKey];
}

bool Input::IsKeyReleased(int vKey) {
    if (vKey < 0 || vKey >= 256) return false;
    return !CurrentKeys[vKey] && PreviousKeys[vKey];
}

void Input::GetMousePos(int& x, int& y) {
    x = MouseX;
    y = MouseY;
}

void Input::SetMousePos(int x, int y) {
    SetCursorPos(x, y);
    MouseX = x;
    MouseY = y;
}

void Input::GetMouseDelta(int& dx, int& dy) {
    dx = MouseX - LastMouseX;
    dy = MouseY - LastMouseY;
}