@echo off
setlocal enabledelayedexpansion
title EcoSphere Campus OS — Launcher

echo ===============================================================================
echo                ECOSPHERE CAMPUS OS (RNSIT) — SYSTEM LAUNCHER
echo ===============================================================================
echo.

:: -----------------------------------------------------------------------------
:: Step 1: Pre-flight check
:: -----------------------------------------------------------------------------
if not exist "node_modules" (
    echo [!] WARNING: "node_modules" directory not found!
    echo [*] Running automated setup first...
    echo.
    call setup.bat
    if %errorlevel% neq 0 (
        echo [!] Setup encountered an error. Aborting launch.
        pause
        exit /b 1
    )
)

if not exist "venv\Scripts\activate.bat" (
    echo [!] Python virtual environment not found. Running setup.bat...
    call setup.bat
)

:: -----------------------------------------------------------------------------
:: Step 2: Start Backend (FastAPI + YOLO + Hermes) in Dedicated Window
:: -----------------------------------------------------------------------------
echo [*] Launching Python FastAPI Backend on http://127.0.0.1:8000 ...
start "EcoSphere AI Backend (FastAPI + YOLO + Hermes)" cmd /k "title EcoSphere Backend (Port 8000) && call venv\Scripts\activate.bat && python backend/server.py"

:: Brief wait for backend port to initialize
timeout /t 2 /nobreak >nul

:: -----------------------------------------------------------------------------
:: Step 3: Start Frontend (Vite Dev Server) in Dedicated Window
:: -----------------------------------------------------------------------------
echo [*] Launching Vite Frontend on http://localhost:5173 ...
start "EcoSphere Web Interface (React 19 + Vite)" cmd /k "title EcoSphere Frontend (Port 5173) && npm run dev -- --host --port 5173"

:: Brief wait for Vite server to come online
timeout /t 3 /nobreak >nul

:: -----------------------------------------------------------------------------
:: Step 4: Open Browser Automatically
:: -----------------------------------------------------------------------------
echo [*] Opening default web browser to EcoSphere Campus Hub...
start http://localhost:5173/

:: -----------------------------------------------------------------------------
:: Step 5: Master Operations Console
:: -----------------------------------------------------------------------------
cls
echo ===============================================================================
echo                ECOSPHERE CAMPUS OS (RNSIT) — ACTIVE RUNNING
echo ===============================================================================
echo.
echo  [+] Web Interface:    http://localhost:5173/
echo  [+] AI Engine API:    http://127.0.0.1:8000/
echo  [+] Hermes Status:    http://127.0.0.1:8000/api/hermes/status
echo  [+] Health Endpoint:  http://127.0.0.1:8000/health
echo.
echo -------------------------------------------------------------------------------
echo  DEMO ACCOUNTS READY TO USE:
echo -------------------------------------------------------------------------------
echo  * STUDENT PORTAL:     Login as student (e.g. Abhiram / 1RN23IS005)
echo                        Tools: Pass-The-Torch, Cafeteria Surplus, Tree Care,
echo                               Resource Bounties, EcoCredits Rewards.
echo.
echo  * ADMIN CONSOLE:      Login as admin (Faculty Administrator)
echo                        Tools: Verification Desk, AI Scanner Intake,
echo                               E-Waste Salvage, Ground Ops Routing, NAAC Audit.
echo -------------------------------------------------------------------------------
echo.
echo  NOTE:
echo   - Both the Frontend and Backend are running in their own terminal windows.
echo   - To stop the entire application, close those terminal windows or press Ctrl+C.
echo.
echo ===============================================================================
echo  Press any key in this window to close this launcher menu...
pause >nul
