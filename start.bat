@echo off
setlocal
title Guardian Campus - Launcher
cd /d "%~dp0"
set "ROOT=%~dp0"
set "VENV_PY=%ROOT%venv\Scripts\python.exe"

echo ================================================================
echo                  GUARDIAN CAMPUS - LAUNCHER
echo ================================================================
echo.

if not exist "%ROOT%node_modules\vite\bin\vite.js" (
    echo Dependencies are missing. Running setup.bat first...
    call "%ROOT%setup.bat"
    if errorlevel 1 exit /b 1
)
if not exist "%VENV_PY%" (
    echo Python backend environment is missing. Running setup.bat first...
    call "%ROOT%setup.bat"
    if errorlevel 1 exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not available in PATH. Install Node.js, reopen this window, and try again.
    pause
    exit /b 1
)
if not exist "%ROOT%.env" if exist "%ROOT%.env.example" (
    copy /y "%ROOT%.env.example" "%ROOT%.env" >nul
    echo Created .env from .env.example. Optional API keys can be added there.
)

echo Starting the API and frontend in separate windows...
start "Guardian Campus API - Port 8000" /D "%ROOT%" cmd /k ""%VENV_PY%" backend\server.py"
start "Guardian Campus Web - Port 5173" /D "%ROOT%" cmd /k "npm run dev -- --host 127.0.0.1 --port 5173"

echo Waiting for the frontend to initialize...
timeout /t 4 /nobreak >nul
start "" "http://localhost:5173/"

echo.
echo Guardian Campus is starting.
echo Frontend: http://localhost:5173/
echo API health: http://127.0.0.1:8000/health
echo Keep both server windows open while using the app.
echo Close the API and Web windows to stop the project.
echo.
pause
exit /b 0
