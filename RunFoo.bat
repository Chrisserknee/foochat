@echo off
REM ============================================
REM FooMe Desktop Launcher for Windows
REM ============================================

echo.
echo  ====================================
echo   FooMe - Photo to Foo Avatar
echo  ====================================
echo.

REM Change to the script's directory
cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Dependencies not installed. Installing now...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Failed to install dependencies!
        echo.
        pause
        exit /b 1
    )
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo.
    echo [WARNING] .env.local not found!
    echo.
    echo Please create a .env.local file with your API keys.
    echo See FOOME_SETUP.md for instructions.
    echo.
    echo Required variables:
    echo   - OPENAI_API_KEY
    echo   - NEXT_PUBLIC_SUPABASE_URL
    echo   - NEXT_PUBLIC_SUPABASE_ANON_KEY
    echo.
    pause
)

REM Check if port 3000 is in use and offer to kill it
echo.
echo [INFO] Checking if port 3000 is available...
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [WARNING] Port 3000 is already in use by another process.
    echo.
    set /p KILL_PORT="Do you want to kill the process and use port 3000? (Y/N): "
    if /i "%KILL_PORT%"=="Y" (
        echo [INFO] Finding and killing process on port 3000...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
            taskkill /F /PID %%a >nul 2>nul
            echo [INFO] Killed process %%a
        )
        timeout /t 2 /nobreak >nul
        echo [INFO] Port 3000 is now available!
        echo.
    )
)

REM Use smart launcher that detects actual port and opens correct URL
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start using Node.js launcher that detects the port
node start-foome.js

pause

