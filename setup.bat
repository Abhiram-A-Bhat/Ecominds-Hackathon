@echo off
setlocal
title Guardian Campus - Windows Setup
cd /d "%~dp0"

echo ================================================================
echo                 GUARDIAN CAMPUS - WINDOWS SETUP
echo ================================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js was not found. Install the current LTS release from https://nodejs.org/
    echo         Then reopen this window and run setup.bat again.
    pause
    exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm was not found. Reinstall Node.js with npm enabled, then retry.
    pause
    exit /b 1
)

node -e "const [m,n]=process.versions.node.split('.').map(Number);process.exit((m===20&&n>=19)||(m===22&&n>=12)||m>22?0:1)"
if errorlevel 1 (
    echo [ERROR] Vite 8 requires Node.js 20.19+ or 22.12+. Found:
    node --version
    echo         Install a current Node.js LTS release, then retry.
    pause
    exit /b 1
)

set "PYTHON_CMD="
where py >nul 2>nul
if not errorlevel 1 (
    py -3 --version >nul 2>nul
    if not errorlevel 1 set "PYTHON_CMD=py -3"
)
if not defined PYTHON_CMD (
    where python >nul 2>nul
    if not errorlevel 1 (
        python --version >nul 2>nul
        if not errorlevel 1 set "PYTHON_CMD=python"
    )
)
if not defined PYTHON_CMD (
    echo [ERROR] Python 3.10 or newer was not found.
    echo         Install Python from https://www.python.org/downloads/windows/
    echo         Enable the Python launcher or Add Python to PATH.
    pause
    exit /b 1
)
%PYTHON_CMD% -c "import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)"
if errorlevel 1 (
    echo [ERROR] Python 3.10 or newer is required. Found:
    %PYTHON_CMD% --version
    pause
    exit /b 1
)

echo [1/4] Installing frontend dependencies...
if exist package-lock.json (
    call npm ci
) else (
    call npm install
)
if errorlevel 1 goto :failed

echo.
echo [2/4] Creating the Python virtual environment...
if not exist "venv\Scripts\python.exe" (
    %PYTHON_CMD% -m venv venv
    if errorlevel 1 goto :failed
)

echo.
echo [3/4] Installing backend dependencies...
call "venv\Scripts\python.exe" -m pip install --upgrade pip
if errorlevel 1 goto :failed
call "venv\Scripts\python.exe" -m pip install -r backend\requirements.txt
if errorlevel 1 goto :failed

echo.
echo [4/4] Preparing local configuration...
if not exist .env (
    if exist .env.example (
        copy /y .env.example .env >nul
        echo Created .env from .env.example. Add API keys there only if you need those integrations.
    ) else (
        echo No .env.example found. The app can still run with its demo fallbacks.
    )
) else (
    echo Existing .env found; left unchanged.
)

echo.
echo ================================================================
echo Setup completed.
echo Run start.bat to launch Guardian Campus.
echo ================================================================
pause
exit /b 0

:failed
echo.
echo [ERROR] Setup stopped because a dependency command failed.
echo         Check the message above, fix the issue, then run setup.bat again.
pause
exit /b 1
