@echo off
echo.
echo ====================================
echo   Clearing Vite Cache
echo ====================================
echo.

if exist "node_modules\.vite" (
    echo Deleting node_modules\.vite...
    rmdir /s /q "node_modules\.vite"
    echo [OK] Deleted node_modules\.vite
) else (
    echo [INFO] node_modules\.vite not found
)

if exist "dist" (
    echo Deleting dist...
    rmdir /s /q "dist"
    echo [OK] Deleted dist
) else (
    echo [INFO] dist not found
)

echo.
echo ====================================
echo   Cache Cleared!
echo ====================================
echo.
echo Next steps:
echo 1. Run: npm run dev
echo 2. Open browser in incognito mode
echo 3. Go to: http://localhost:5173
echo 4. Test signup
echo.
pause
