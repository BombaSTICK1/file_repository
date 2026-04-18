# Скрипт для быстрого запуска всех сервисов на Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Запуск File Repository System" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Backend
Write-Host "[1/3] Запускаю Backend (порт 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList {
    cd d:\Diplom_Ivan\backend
    .\venv\Scripts\Activate.ps1
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
}

Start-Sleep -Seconds 2

# Frontend
Write-Host "[2/3] Запускаю Frontend (порт 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList {
    cd d:\Diplom_Ivan\frontend
    npm run dev
}

Start-Sleep -Seconds 2



Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Все сервисы запущены!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

