@echo off
echo ========================================
echo Creating Ticketing Agent and Driver
echo ========================================
echo.

cd /d "%~dp0.."

echo Running user creation script...
node scripts/create-users.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Users created.
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ERROR! Failed to create users.
    echo ========================================
    exit /b 1
)

pause
