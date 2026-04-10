// frontend/src/components/AuthForm.tsx
import { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import client from '../api/client';
import { translations, type Language } from '../translations';

interface AuthFormProps {
  language: Language;
}

export default function AuthForm({ language }: AuthFormProps) {
  const t = translations[language];
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      console.log(`Отправляю запрос на ${endpoint}:`, { username, password });

      const res = await client.post(endpoint, { username, password });

      console.log('Ответ сервера:', res.data);

      if (res.data.access_token) {
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('username', username);
        console.log('Токен сохранён, перезагружаю страницу...');
        window.location.reload();
      } else {
        setError(t.error + ': ' + t.uploadError);
      }
    } catch (error: any) {
      console.error('Ошибка:', error);
      const errorMsg =
        error.response?.data?.detail ||
        (isLogin ? 'Неверные учётные данные' : 'Пользователь уже существует');
      setError(`${errorMsg} (${error.response?.status || 'неизвестная ошибка'})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            width: '100%',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Заголовок с иконкой */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: '#58a6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LockIcon sx={{ color: 'white', fontSize: 28 }} />
            </Box>
          </Box>

          {/* Заголовок */}
          <Typography
            variant="h4"
            component="h1"
            sx={{
              textAlign: 'center',
              mb: 1,
              fontWeight: 600,
              color: '#24292e',
            }}
          >
            File Repository
          </Typography>

          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              mb: 3,
              color: '#57606a',
            }}
          >
            {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
          </Typography>

          {/* Сообщение об ошибке */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Форма */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t.username}
              variant="outlined"
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#d0d7de',
                  },
                  '&:hover fieldset': {
                    borderColor: '#58a6ff',
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label={t.password}
              type="password"
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#d0d7de',
                  },
                  '&:hover fieldset': {
                    borderColor: '#58a6ff',
                  },
                },
              }}
            />

            {/* Основная кнопка */}
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                backgroundColor: '#238636',
                '&:hover': {
                  backgroundColor: '#2ea043',
                },
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                  {t.loading}
                </>
              ) : isLogin ? (
                t.loginBtn
              ) : (
                t.registerBtn
              )}
            </Button>

            {/* Альтернативная кнопка */}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
              sx={{
                py: 1.2,
                borderColor: '#d0d7de',
                color: '#24292e',
                '&:hover': {
                  backgroundColor: '#f6f8fa',
                  borderColor: '#58a6ff',
                },
                fontSize: '14px',
              }}
            >
              {isLogin ? t.authRegister : t.authLogin}
            </Button>
          </form>

          {/* Подвал */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 3,
              color: '#57606a',
            }}
          >
            {t.description}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}