#pragma once
#include <Windows.h>
#include <d3d11.h>
#include <dxgi.h>
#include "GameStructs.h"   // ADD THIS for Vector3

// Forward declare ImGui stuff
struct ImDrawData;

class Renderer {
public:
    static bool Initialize();
    static void Shutdown();
    static void BeginFrame();
    static void EndFrame();
    static void Present();

    // Drawing functions
    static void DrawLine(float x1, float y1, float x2, float y2, float* color, float thickness = 1.0f);
    static void DrawBox(float x, float y, float w, float h, float* color, float thickness = 1.0f);
    static void DrawFilledBox(float x, float y, float w, float h, float* color);
    static void DrawCircle(float x, float y, float radius, float* color, int segments = 32);
    static void DrawFilledCircle(float x, float y, float radius, float* color, int segments = 32);
    static void DrawText(const char* text, float x, float y, float size, float* color);
    static void DrawSkeleton(Vector3* bones, int count, float* color);  // FIXED signature

    static void DrawMenu();

    static bool IsMenuOpen() { return MenuOpen; }
    static void ToggleMenu() { MenuOpen = !MenuOpen; }

    static float ScreenWidth;
    static float ScreenHeight;

private:
    static ID3D11Device* Device;
    static ID3D11DeviceContext* Context;
    static IDXGISwapChain* SwapChain;
    static ID3D11RenderTargetView* RenderTarget;
    static bool MenuOpen;

    static bool CreateDevice(HWND hwnd);
    static void CreateRenderTarget();  // ADD THIS declaration
    static void CleanupDevice();
    static LRESULT CALLBACK WndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam);
};