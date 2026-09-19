@echo off
title ForgeProof - SaaS Frontend Backup (Port 5174)
color 0E
cd /d "%~dp0"
echo =====================================================================
echo          FORGEPROOF SAAS FRONTEND (BACKUP EDITION · PORT 5174)
echo =====================================================================
echo [*] Starting Vite on http://localhost:5174 ...
call npm run dev -- --host 0.0.0.0 --port 5174
echo.
echo [!] SaaS Frontend process stopped.
pause
