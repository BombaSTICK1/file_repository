@echo off
REM Script для запуска всех сервисов (Backend, Frontend, Cloudflare Tunnel)

echo ============================================
echo Запуск File Repository System
echo ============================================

cd /d d:\Diplom_Ivan

REM Запускаем Backend в отдельном окне
echo.
echo [1/3] Запуск Backend (порт 8000)...
start "Backend - File Repository" cmd /k "cd backend && venv\Scripts\activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

REM Даём время на запуск backend
timeout /t 3 /nobreak

REM Запускаем Frontend в отдельном окне
echo [2/3] Запуск Frontend (порт 5173)...
start "Frontend - File Repository" cmd /k "cd frontend && npm run dev"

REM Даём время на запуск frontend
timeout /t 3 /nobreak


echo.
echo ============================================
echo Все сервисы запущены!
echo ============================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Для остановки закрой окна сервисов
pause
