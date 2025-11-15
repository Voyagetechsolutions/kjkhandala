@echo off
echo Clearing Vite cache and restarting...
echo.

REM Kill any running Vite processes
taskkill /F /IM node.exe 2>nul

REM Clear Vite cache
if exist node_modules\.vite rmdir /s /q node_modules\.vite
echo Vite cache cleared!

REM Clear browser cache instructions
echo.
echo ============================================
echo IMPORTANT: Clear your browser cache!
echo ============================================
echo.
echo In your browser, press:
echo   Chrome/Edge: Ctrl + Shift + Delete
echo   Firefox: Ctrl + Shift + Delete
echo.
echo Then select "Cached images and files" and click Clear
echo.
echo Or do a hard refresh:
echo   Ctrl + F5 (Windows)
echo   Ctrl + Shift + R (Windows/Linux)
echo   Cmd + Shift + R (Mac)
echo ============================================
echo.

pause

REM Restart Vite
echo Starting Vite dev server...
npm run dev
