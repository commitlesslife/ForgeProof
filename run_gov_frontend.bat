@echo off
title ForgeProof - Government Edition (Port 5174)
color 09
cd /d "%~dp0\frontend-gov"
echo =====================================================================
echo          FORGEPROOF GOVERNMENT OF INDIA EDITION (PORT 5174)
echo =====================================================================
echo [*] Checking node_modules in frontend-gov ...
if not exist "node_modules\" (
    echo [*] Linking shared node_modules from frontend to save disk space...
    mklink /J "node_modules" "..\frontend\node_modules" >nul 2>&1
    if errorlevel 1 (
        echo [*] Installing node_modules in frontend-gov...
        call npm install
    )
)
echo [*] Starting Vite Government edition on http://localhost:5174 ...
call npm run dev -- --host 0.0.0.0 --port 5174
echo.
echo [!] Government Frontend process stopped.
pause
