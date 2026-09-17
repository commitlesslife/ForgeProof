@echo off
title ForgeProof Master Launcher
color 0A

echo =====================================================================
echo                FORGEPROOF MASTER LAUNCHER
echo =====================================================================
echo.

:: 1. Free ports 8000 and 5173
echo [*] Freeing ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
taskkill /F /IM cloudflared.exe >nul 2>&1

echo [*] Launching Backend Server...
start "ForgeProof - Backend" "%~dp0backend\run_backend.bat"

echo [*] Launching Frontend Portal...
start "ForgeProof - Frontend" "%~dp0frontend\run_frontend.bat"

echo [*] Launching Cloudflare Tunnel...
start "ForgeProof - Tunnel" "%~dp0run_tunnel.bat"

echo.
echo =====================================================================
echo  All 3 services are now running in separate windows:
echo    - Backend:    http://127.0.0.1:8000
echo    - Frontend:   http://localhost:5173
echo    - Tunnel:     Check the 'ForgeProof - Cloudflare Tunnel' window!
echo =====================================================================
echo.
echo [*] Opening ForgeProof in your browser in 5 seconds...
ping 127.0.0.1 -n 6 >nul
start http://localhost:5173

echo.
echo You can close this launcher window now.
echo To stop everything later, double-click: stop_forgeproof.bat
echo.
pause
