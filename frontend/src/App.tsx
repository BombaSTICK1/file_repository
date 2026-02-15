// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import RepoList from './components/RepoList';
import AuthForm from './components/AuthForm'; // ← ДОБАВЬ ЭТОТ ИМПОРТ

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Проверяем наличие токена при загрузке
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    // Показываем форму авторизации
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthForm />
      </ThemeProvider>
    );
  }

  // Показываем основной интерфейс
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '20px' 
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 600,
          borderBottom: '1px solid #e1e4e8',
          paddingBottom: '12px',
          marginBottom: '24px'
        }}>
          File Repository
        </h1>
        <RepoList />
      </div>
    </ThemeProvider>
  );
}

export default App;