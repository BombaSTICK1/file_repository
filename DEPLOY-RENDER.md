# Деплой на Render + Neon

## 📋 Что понадобится

1. Аккаунт на [Render](https://render.com)
2. Аккаунт на [Neon](https://neon.tech)
3. Git-репозиторий с кодом (GitHub/GitLab)

---

## 🗄️ Шаг 1: Настройка базы данных (Neon)

1. **Зарегистрируйся на Neon**
   - Перейди на [neon.tech](https://neon.tech)
   - Войди через GitHub
   - Click "New Project"

2. **Создай базу данных**
   - Project name: `file-repo`
   - Database name: `file_repo` (или оставь `neondb`)
   - Click "Create project"

3. **Получи Connection String**
   - В дашборде проекта нажми "Connection Details"
   - Скопируй **Connection string** (формат: `postgresql://user:password@host/dbname`)
   - ⚠️ Сохрани его — понадобится для Render

---

## 🚀 Шаг 2: Деплой на Render

### Вариант A: Через render.yaml (рекомендуется)

1. **Запуш код в Git**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <твой-repo-url>
   git push -u origin main
   ```

2. **Подключи репозиторий к Render**
   - Зайди на [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Подключи свой Git-репозиторий
   - Render автоматически распознает `render.yaml`

3. **Настрой переменные окружения**

   **Для backend:**
   - `DATABASE_URL` — вставь connection string от Neon
   - `SECRET_KEY` — сгенерируй случайную строку (например, через `openssl rand -hex 32`)
   - `ENVIRONMENT` = `production`
   - `FRONTEND_URL` — пока оставь пустым, заполнишь после деплоя frontend

   **Для frontend:**
   - `VITE_API_URL` = `https://<твой-backend>.onrender.com/api`

4. **Запусти деплой**
   - Click "Apply"
   - Render создаст 2 сервиса и начнёт деплой
   - Backend: ~3-5 минут
   - Frontend: ~2-3 минуты

---

### Вариант B: Ручное создание сервисов

Если `render.yaml` не сработал:

#### 1. Backend

- **New +** → **Web Service**
- Подключи репозиторий
- **Настройки:**
  - Name: `file-repo-backend`
  - Region: `Frankfurt, Germany`
  - Branch: `main`
  - Root Directory: `backend/app`
  - Runtime: `Python 3`
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  - Instance Type: **Free**

- **Environment Variables:**
  ```
  DATABASE_URL=<твой-postgresql-url-от-neon>
  SECRET_KEY=<случайная-строка-32+символа>
  ENVIRONMENT=production
  FRONTEND_URL=<url-frontend-после-деплоя>
  ```

- **Disk (опционально, для хранения файлов):**
  - Name: `storage`
  - Mount Path: `/opt/render/project/src/backend/storage`
  - Size: `1 GB`

#### 2. Frontend

- **New +** → **Static Site**
- Подключи репозиторий
- **Настройки:**
  - Name: `file-repo-frontend`
  - Region: `Frankfurt, Germany`
  - Branch: `main`
  - Root Directory: `frontend`
  - Build Command: `npm install && npm run build`
  - Publish Directory: `dist`
  - Instance Type: **Free**

- **Environment Variables:**
  ```
  VITE_API_URL=https://<твой-backend>.onrender.com/api
  ```

---

## ✅ Шаг 3: Проверка

1. **Проверь backend**
   - Открой `https://<твой-backend>.onrender.com/api`
   - Должен увидеть: `{"message": "File Repository API"}`

2. **Проверь frontend**
   - Открой `https://<твой-frontend>.onrender.com`
   - Попробуй зарегистрироваться и войти

3. **Проверь базу на Neon**
   - В дашборде Neon перейди в "Tables"
   - Должны быть таблицы: `users`, `repositories`, `folders`, `files`, `file_versions`

---

## 🔧 Шаг 4: Обновление CORS (если нужно)

Если frontend не может подключиться к backend:

1. В Render открой **backend** сервис
2. Добавь переменную:
   ```
   FRONTEND_URL=https://<твой-frontend>.onrender.com
   ```
3. Click "Manual Deploy" для перезапуска

---

## ⚠️ Важные замечания

### Free tier ограничения Render:
- Backend засыпает через 15 минут бездействия
- Первое запрос после "сна" может занять 30-50 секунд
- Для production рассмотри платный план ($7/месяц)

### Neon:
- Free tier: 0.5 GB хранилища
- Проект не засыпает
- Автоматический бэкап

### Хранение файлов:
- В бесплатном тарифе Render диск временный
- Для надёжного хранения файлов подключи S3 (например, Cloudflare R2)

---

## 🐛 Troubleshooting

### Backend не запускается
```
1. Проверь логи в Render Dashboard
2. Убедись что DATABASE_URL правильный
3. Проверь что SECRET_KEY установлен
```

### Frontend не видит API
```
1. Проверь VITE_API_URL в настройках frontend
2. URL должен заканчиваться на /api
3. Проверь CORS в логах backend
```

### Ошибки базы данных
```
1. Проверь что Neon проект активен
2. Убедись что таблица создана (миграции прошли)
3. Проверь права доступа в Neon Dashboard
```

---

## 📞 Поддержка

- Render Docs: https://render.com/docs
- Neon Docs: https://neon.tech/docs
- GitHub Issues: <твой-repo>
