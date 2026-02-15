// frontend/src/api/client.ts
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

// Добавляем токен к каждому запросу
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;