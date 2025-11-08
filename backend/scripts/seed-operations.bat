@echo off
echo ================================================
echo   KJ Khandala - Operations Database Seeding
echo ================================================
echo.

cd /d "%~dp0.."

echo [1/1] Running Operations Seed Script...
node prisma/seed-operations.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo   SUCCESS! Operations data seeded successfully
    echo ================================================
    echo.
    echo You can now access the Operations module with:
    echo   Email: operations@kjkhandala.com
    echo   Password: operations123
    echo.
    echo Data created:
    echo   - 5 Routes
    echo   - 8 Buses
    echo   - 6 Drivers
    echo   - 12+ Trips (today and tomorrow)
    echo   - 20 Passengers
    echo   - 100+ Bookings
    echo   - 3 Incidents
    echo   - 3 Maintenance Records
    echo.
) else (
    echo.
    echo ================================================
    echo   ERROR! Failed to seed operations data
    echo ================================================
    echo.
)

pause
