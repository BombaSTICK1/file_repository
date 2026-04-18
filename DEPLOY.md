# Инструкция по деплою на Fly.io

## 1. Установка Fly CLI

```powershell
winget install flyctl
```

После установки перезапусти терминал.

## 2. Регистрация и вход

```powershell
fly auth login
```

## 3. Создание PostgreSQL базы данных

```powershell
fly postgres create --name file-repo-db
```

Сохрани пароль — он понадобится.

## 4. Создание приложения Backend

```powershell
fly launch --no-deploy --name file-repository-api --region ams
```

### Подключаем базу данных:
```powershell
fly postgres attach -a file-repository-api file-repo-db
```

Fly.io автоматически добавит `DATABASE_URL` в секреты.

### Добавляем секретный ключ:
```powershell
fly secrets set SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
```

### Деплой backend:
```powershell
fly deploy -a file-repository-api
```

### Проверка backend:
```powershell
fly open -a file-repository-api
```

## 5. Создание приложения Frontend

```powershell
cd frontend
fly launch --no-deploy --name file-repository-frontend --region ams
```

### Обнови fly.toml в папке frontend, если нужно

### Деплой frontend:
```powershell
fly deploy -a file-repository-frontend
```

## 6. Проверка

После деплоя:
- Backend: `https://file-repository-api.fly.dev`
- Frontend: `https://file-repository-frontend.fly.dev`

## Команды управления

```powershell
# Логи
fly logs -a file-repository-api
fly logs -a file-repository-frontend

# Статус
fly status -a file-repository-api

# SSH в контейнер
fly ssh console -a file-repository-api

# Перезапуск
fly restart -a file-repository-api
```

## Важно!

1. Бесплатный тариф: 3 shared VMs, 160GB трафика/мес
2. Приложения "засыпают" после 30 минут без активности (пробуждаются ~6 сек)
3. Postgres на бесплатном тарифе: 1 shared VM, 1GB storage
4. Для хранения файлов (S3) можно добавить Cloudflare R2 (бесплатно до 10GB)
