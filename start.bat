@echo off
REM Email Validator - Single Click Startup
REM This batch file builds and runs the email validator server

echo.
echo ========================================
echo    EMAIL VALIDATOR - STARTUP SCRIPT
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this file from the email_validator project root directory.
    echo.
    pause
    exit /b 1
)

REM Clear screen
cls

echo Starting Email Validator Server...
echo.
echo Step 1: Installing Dependencies...
echo.

REM Install dependencies
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: npm install failed!
    echo.
    pause
    exit /b 1
)

echo.
echo Step 2: Building TypeScript...
echo.

REM Build the project
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build failed!
    echo.
    pause
    exit /b 1
)

echo.
echo Step 3: Starting Server...
echo.
echo ========================================
echo    SERVER RUNNING
echo ========================================
echo.
echo Open your browser and go to:
echo http://localhost:3004
echo.
echo Press Ctrl+C to stop the server
echo.

REM Open browser automatically after a short delay
REM Give the server a moment to start
timeout /t 2 /nobreak >nul

REM Open the URL in default browser
start http://localhost:3004

REM Start the server
node server.js

REM If server stops, pause to show any error messages
echo.
echo Server stopped. Press any key to exit...
pause
