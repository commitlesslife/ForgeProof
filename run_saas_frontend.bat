@echo off
title ForgeProof - SaaS Backup Edition (Port 5174)
color 09
cd /d "%~dp0\frontend-saas"
echo =====================================================================
echo          FORGEPROOF SAAS EDITION (BACKUP · PORT 5174)
echo =====================================================================
echo [*] Checking node_modules in frontend-saas ...
if not exist "node_modules\" (
    echo [*] Linking shared node_modules from frontend to save disk space...
    mklink /J "node_modules" "..\frontend\node_modules" >nul 2>&1
    if errorlevel 1 (
        echo [*] Installing node_modules in frontend-saas...
        call npm install
    )
)
echo [*] Starting Vite SaaS edition on http://localhost:5174 ...
call npm run dev -- --host 0.0.0.0 --port 5174
echo.
echo [!] SaaS Frontend process stopped.
pause
