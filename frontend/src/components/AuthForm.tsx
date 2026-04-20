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
      const res = await client.post(endpoint, { username, password });


      if (res.data.access_token) {
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('username', username);
        window.location.reload();

      } else {
        setError(t.error + ': ' + t.uploadError);
      }
    } catch (error: any) {

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
          elevation={0}
          sx={{
            p: { xs: 3, md: 4.5 },
            borderRadius: 5,
            width: '100%',
            maxWidth: 520,
            backgroundColor: 'rgba(255,255,255,0.86)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.12)',
          }}
        >

          {/* Заголовок с иконкой */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 14px 30px rgba(37, 99, 235, 0.28)',
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
              color: 'text.primary',

            }}
          >
            File Repository
          </Typography>

          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              mb: 3,
              color: 'text.secondary',

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
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.72)',
                  '& fieldset': {
                    borderColor: 'rgba(148, 163, 184, 0.28)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
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
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.72)',
                  '& fieldset': {
                    borderColor: 'rgba(148, 163, 184, 0.28)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
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
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: '0 14px 30px rgba(37, 99, 235, 0.22)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
                },
                fontSize: '16px',
                fontWeight: 600,
                borderRadius: 3,

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
                borderColor: 'rgba(148, 163, 184, 0.35)',
                color: 'text.primary',
                backgroundColor: 'rgba(255,255,255,0.55)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  borderColor: 'primary.main',
                },
                fontSize: '14px',
                borderRadius: 3,

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
              color: 'text.secondary',

            }}
          >
            {t.description}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}