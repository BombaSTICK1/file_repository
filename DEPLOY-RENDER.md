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

## 🚀 Шаг 2: Деплой на Render (ручное создание)

### 1. Backend

1. **Зайди на [dashboard.render.com](https://dashboard.render.com)**
2. Click **"New +"** → **"Web Service"**
3. Подключи свой Git-репозиторий
4. **Заполни настройки:**

| Поле | Значение |
|------|----------|
| Name | `file-repo-backend` |
| Region | `Frankfurt, Germany` |
| Branch | `main` |
| Root Directory | `backend/app` |
| Runtime | `Python 3.11` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Instance Type | **Free** |

5. **Environment Variables** (добавь каждую):

```
DATABASE_URL=<твой-postgresql-url-от-neon>
SECRET_KEY=<случайная-строка-32+символа>
ENVIRONMENT=production
FRONTEND_URL=<заполнишь-после-деплоя-frontend>
```

6. Click **"Create Web Service"**
7. Жди ~3-5 минут пока сервис задеплоится

---

### 2. Frontend

1. **Вернись в Dashboard Render**
2. Click **"New +"** → **"Static Site"**
3. Подключи тот же Git-репозиторий
4. **Заполни настройки:**

| Поле | Значение |
|------|----------|
| Name | `file-repo-frontend` |
| Branch | `main` |
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

5. **Environment Variables:**

```
VITE_API_URL=https://<твой-backend>.onrender.com/api
```

⚠️ **Важно:** замени `<твой-backend>` на URL из первого шага (например: `https://file-repo-backend-xyz.onrender.com`)

6. Click **"Create Static Site"**
7. Жди ~2-3 минуты

---

### 3. Обновление CORS (обязательно!)

После деплоя frontend нужно обновить backend:

1. В Render открой **backend** сервис
2. Перейди во вкладку **"Environment"**
3. Измени переменную:
   ```
   FRONTEND_URL=https://<твой-frontend>.onrender.com
   ```
4. Click **"Save Changes"**
5. Render автоматически перезапустит сервис

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

## 🔧 Шаг 4: Если что-то не работает

### Backend не запускается
```
1. Открой Render Dashboard → backend сервис
2. Перейди во вкладку "Logs"
3. Ищи ошибки при старте
4. Частые проблемы:
   - Неправильный DATABASE_URL
   - Отсутствует SECRET_KEY
   - Ошибки миграции БД
```

### Frontend не видит API
```
1. Проверь VITE_API_URL в настройках frontend
2. URL должен быть вида: https://<backend>.onrender.com/api
3. Проверь CORS в логах backend (вкладка Logs)
4. Убедись что FRONTEND_URL установлен в backend
```

### Ошибки базы данных
```
1. Проверь что Neon проект активен
2. В Neon Dashboard перейди в "Tables"
3. Если таблиц нет — проверь логи backend
4. Миграции должны создаться автоматически при старте
```

### Файлы не сохраняются
⚠️ На бесплатном тарифе Render файлы хранятся временно и исчезают после перезапуска.

Для постоянного хранения:
- Подключи S3-совместимое хранилище (Cloudflare R2, AWS S3)
- Или перейди на платный тариф Render ($7/месяц) с диском

---

## ⚠️ Важные замечания

### Free tier ограничения Render:
- Backend засыпает через 15 минут бездействия
- Первый запрос после "сна" занимает 30-50 секунд
- Файлы хранятся временно (исчезают при перезапуске)
- Для production рассмотри платный план ($7/месяц)

### Neon:
- Free tier: 0.5 GB хранилища
- Проект не засыпает
- Автоматический бэкап
- Отличная альтернатива для продакшена

---

## 📞 Поддержка

- Render Docs: https://render.com/docs
- Neon Docs: https://neon.tech/docs
- GitHub Issues: <твой-repo>
