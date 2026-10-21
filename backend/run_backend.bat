@echo off
title ForgeProof - Backend (Port 8000)
color 0B
cd /d "%~dp0"
echo =====================================================================
echo                FORGEPROOF BACKEND API SERVER
echo =====================================================================
echo [*] Directory: %~dp0
echo [*] Starting FastAPI on http://127.0.0.1:8000 ...
if exist "%~dp0venv\Scripts\activate.bat" (
    echo [*] Activating local virtualenv...
    call "%~dp0venv\Scripts\activate.bat"
)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
echo.
echo [!] Backend process stopped.
pause
