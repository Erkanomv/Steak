#include <Windows.h>
#include <cmath>
#include <vector>
#include <algorithm>
#include "Renderer.h"
#include <d3d11.h>
#include <dxgi.h>

// Note: For a complete implementation, you'd integrate ImGui here
// This is a simplified version showing the structure

ID3D11Device* Renderer::Device = nullptr;
ID3D11DeviceContext* Renderer::Context = nullptr;
IDXGISwapChain* Renderer::SwapChain = nullptr;
ID3D11RenderTargetView* Renderer::RenderTarget = nullptr;
bool Renderer::MenuOpen = true;
float Renderer::ScreenWidth = 1920;
float Renderer::ScreenHeight = 1080;

bool Renderer::Initialize() {
    // Create overlay window
    WNDCLASSEXW wc = { sizeof(WNDCLASSEXW), CS_CLASSDC, WndProc, 0L, 0L,
                     GetModuleHandle(nullptr), nullptr, nullptr, nullptr, nullptr,
                     L"FiveMOverlay", nullptr };
    RegisterClassExW(&wc);

    HWND hwnd = CreateWindowExW(WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOPMOST | WS_EX_TOOLWINDOW,
        L"FiveMOverlay", L"FiveM Internal", WS_POPUP, 0, 0,
        (int)ScreenWidth, (int)ScreenHeight, nullptr, nullptr, wc.hInstance, nullptr);

    SetLayeredWindowAttributes(hwnd, RGB(0, 0, 0), 0, LWA_COLORKEY);
    ShowWindow(hwnd, SW_SHOW);

    // Create D3D11 device
    if (!CreateDevice(hwnd)) {
        return false;
    }

    // Initialize ImGui here (if using ImGui)
    // ImGui::CreateContext();
    // ImGui_ImplWin32_Init(hwnd);
    // ImGui_ImplDX11_Init(Device, Context);

    return true;
}

void Renderer::Shutdown() {
    // Cleanup ImGui
    // ImGui_ImplDX11_Shutdown();
    // ImGui_ImplWin32_Shutdown();
    // ImGui::DestroyContext();

    CleanupDevice();
}

bool Renderer::CreateDevice(HWND hwnd) {
    DXGI_SWAP_CHAIN_DESC sd = {};
    sd.BufferCount = 2;
    sd.BufferDesc.Width = 0;
    sd.BufferDesc.Height = 0;
    sd.BufferDesc.Format = DXGI_FORMAT_R8G8B8A8_UNORM;
    sd.BufferDesc.RefreshRate.Numerator = 60;
    sd.BufferDesc.RefreshRate.Denominator = 1;
    sd.Flags = DXGI_SWAP_CHAIN_FLAG_ALLOW_MODE_SWITCH;
    sd.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
    sd.OutputWindow = hwnd;
    sd.SampleDesc.Count = 1;
    sd.SampleDesc.Quality = 0;
    sd.Windowed = TRUE;
    sd.SwapEffect = DXGI_SWAP_EFFECT_DISCARD;

    D3D_FEATURE_LEVEL featureLevel;
    const D3D_FEATURE_LEVEL featureLevelArray[2] = { D3D_FEATURE_LEVEL_11_0, D3D_FEATURE_LEVEL_10_0 };

    HRESULT res = D3D11CreateDeviceAndSwapChain(nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr,
        0, featureLevelArray, 2, D3D11_SDK_VERSION, &sd, &SwapChain, &Device, &featureLevel, &Context);

    if (res != S_OK) return false;

    CreateRenderTarget();
    return true;
}

void Renderer::CreateRenderTarget() {
    ID3D11Texture2D* pBackBuffer;
    SwapChain->GetBuffer(0, IID_PPV_ARGS(&pBackBuffer));
    Device->CreateRenderTargetView(pBackBuffer, nullptr, &RenderTarget);
    pBackBuffer->Release();
}

void Renderer::CleanupDevice() {
    if (RenderTarget) { RenderTarget->Release(); RenderTarget = nullptr; }
    if (SwapChain) { SwapChain->Release(); SwapChain = nullptr; }
    if (Context) { Context->Release(); Context = nullptr; }
    if (Device) { Device->Release(); Device = nullptr; }
}

void Renderer::BeginFrame() {
    // Clear screen
    const float clearColor[4] = { 0.0f, 0.0f, 0.0f, 0.0f };
    Context->ClearRenderTargetView(RenderTarget, clearColor);

    // Start ImGui frame (if using)
    // ImGui_ImplDX11_NewFrame();
    // ImGui_ImplWin32_NewFrame();
    // ImGui::NewFrame();
}

void Renderer::EndFrame() {
    // Render ImGui (if using)
    // ImGui::Render();
    // ImGui_ImplDX11_RenderDrawData(ImGui::GetDrawData());
}

void Renderer::Present() {
    SwapChain->Present(1, 0); // VSync on
}

void Renderer::DrawLine(float x1, float y1, float x2, float y2, float* color, float thickness) {
    // Implementation using D3D11 or ImGui draw list
    // ImGui::GetBackgroundDrawList()->AddLine(ImVec2(x1, y1), ImVec2(x2, y2), 
    //     IM_COL32(color[0]*255, color[1]*255, color[2]*255, color[3]*255), thickness);
}

void Renderer::DrawBox(float x, float y, float w, float h, float* color, float thickness) {
    // ImGui::GetBackgroundDrawList()->AddRect(ImVec2(x, y), ImVec2(x+w, y+h),
    //     IM_COL32(color[0]*255, color[1]*255, color[2]*255, color[3]*255), 0, 0, thickness);
}

void Renderer::DrawFilledBox(float x, float y, float w, float h, float* color) {
    // ImGui::GetBackgroundDrawList()->AddRectFilled(ImVec2(x, y), ImVec2(x+w, y+h),
    //     IM_COL32(color[0]*255, color[1]*255, color[2]*255, color[3]*255));
}

void Renderer::DrawCircle(float x, float y, float radius, float* color, int segments) {
    // ImGui::GetBackgroundDrawList()->AddCircle(ImVec2(x, y), radius,
    //     IM_COL32(color[0]*255, color[1]*255, color[2]*255, color[3]*255), segments);
}

void Renderer::DrawFilledCircle(float x, float y, float radius, float* color, int segments) {
    // ImGui::GetBackgroundDrawList()->AddCircleFilled(ImVec2(x, y), radius,
    //     IM_COL32(color[0]*255, color[1]*255, color[2]*255, color[3]*255), segments);
}

void Renderer::DrawText(const char* text, float x, float y, float size, float* color) {
    // ImGui::GetBackgroundDrawList()->AddText(ImVec2(x, y), 
    //     IM_COL32(color[0]*255, color[1]*255, color[2]*255, color[3]*255), text);
}

void Renderer::DrawSkeleton(Vector3* bones, int count, float* color) {
    // Draw lines between bones
    for (int i = 0; i < count - 1; i++) {
        // WorldToScreen conversion needed here
    }
}

void Renderer::DrawMenu() {
    // ImGui::Begin("FiveM Internal");
    // ImGui::Checkbox("ESP", &ESP::Config.Enabled);
    // ImGui::Checkbox("Box", &ESP::Config.Box);
    // ImGui::Checkbox("Skeleton", &ESP::Config.Skeleton);
    // ... etc
    // ImGui::End();
}

LRESULT CALLBACK Renderer::WndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    // Pass to ImGui (if using)
    // if (ImGui_ImplWin32_WndProcHandler(hWnd, msg, wParam, lParam))
    //     return true;

    return DefWindowProc(hWnd, msg, wParam, lParam);
}