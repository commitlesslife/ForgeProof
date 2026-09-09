@echo off
title ForgeProof - AI Fake Identity Screening System (SIH 2026)
echo =========================================================================
echo               FORGEPROOF - SMART INDIA HACKATHON 2026
echo     AI-Based Fake Identity & Document Screening System (Border Checkpoint)
echo =========================================================================
echo.

echo [1/3] Starting ForgeProof FastAPI Backend Server (Port 8000)...
start "ForgeProof Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir app"

timeout /t 2 /nobreak >nul

echo [2/3] Starting ForgeProof Officer Review Station (Port 5173)...
start "ForgeProof Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Launching Border Screening Terminal in default browser...
start http://localhost:5173

echo.
echo =========================================================================
echo [OK] ForgeProof is now running!
echo Backend API Docs:   http://localhost:8000/docs
echo Officer Terminal:   http://localhost:5173
echo =========================================================================
echo.
pause
