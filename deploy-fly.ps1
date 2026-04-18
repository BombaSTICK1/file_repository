# Скрипт деплоя на Fly.io

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Деплой File Repository на Fly.io" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка установки flyctl
Write-Host "[1/5] Проверка flyctl..." -ForegroundColor Yellow
try {
    flyctl version 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Host "  flyctl установлен" -ForegroundColor Green
}
catch {
    Write-Host "  flyctl не найден. Установите: winget install flyctl" -ForegroundColor Red
    exit 1
}

# Логин
Write-Host ""
Write-Host "[2/5] Проверка авторизации..." -ForegroundColor Yellow
flyctl auth whoami 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Необходимо войти. Выполните: flyctl auth login" -Foreground Yellow
    flyctl auth login
}

# Создание backend приложения
Write-Host ""
Write-Host "[3/5] Создание/обновление Backend..." -ForegroundColor Yellow
if (-not (Test-Path "fly.toml")) {
    flyctl launch --no-deploy --name file-repository-api --region ams
}
else {
    Write-Host "  fly.toml найден, используем существующую конфигурацию"
}

# Установка секретного ключа
Write-Host "  Установка SECRET_KEY..." -ForegroundColor Gray
$secretKey = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes([guid]::NewGuid().ToString()))
flyctl secrets set SECRET_KEY="$secretKey" -a file-repository-api

# Деплой backend
Write-Host "  Деплой backend..." -ForegroundColor Gray
flyctl deploy -a file-repository-api

# Создание frontend приложения
Write-Host ""
Write-Host "[4/5] Создание/обновление Frontend..." -ForegroundColor Yellow
Set-Location frontend
if (-not (Test-Path "../fly-frontend.toml")) {
    flyctl launch --no-deploy --name file-repository-frontend --region ams
}
else {
    flyctl deploy -a file-repository-frontend
}
Set-Location ..

# Информация
Write-Host ""
Write-Host "[5/5] Готово!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Приложения развёрнуты:" -ForegroundColor Green
Write-Host "  Backend:  https://file-repository-api.fly.dev" -ForegroundColor Cyan
Write-Host "  Frontend: https://file-repository-frontend.fly.dev" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Управление:" -ForegroundColor Yellow
Write-Host "  fly logs -a file-repository-api       # Логи backend"
Write-Host "  fly logs -a file-repository-frontend # Логи frontend"
Write-Host "  fly open -a file-repository-api      # Открыть в браузере"
