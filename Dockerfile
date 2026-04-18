# Multi-stage build для единого Docker образ
FROM python:3.11-slim AS backend-builder

WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app


FROM node:18-alpine AS frontend-builder

WORKDIR /app

COPY frontend/package*.json .
RUN npm ci

COPY frontend .
RUN npm run build


FROM nginx:alpine AS production

# Копируем статику из фронтенда
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Копируем конфиг nginx для React Router
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \

    location / { \
    try_files $uri $uri/ /index.html; \
    } \

    location /api/ { \
    proxy_pass http://localhost:8000/api/; \
    proxy_http_version 1.1; \
    proxy_set_header Upgrade $http_upgrade; \
    proxy_set_header Connection "upgrade"; \
    proxy_set_header Host $host; \
    proxy_set_header X-Real-IP $remote_addr; \
    proxy_cache_bypass $http_upgrade; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
