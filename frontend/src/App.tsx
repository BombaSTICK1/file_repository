// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import StorageIcon from '@mui/icons-material/Storage';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LanguageIcon from '@mui/icons-material/Language';
import RepoList from './components/RepoList';
import AuthForm from './components/AuthForm';
import { translations, type Language } from './translations';

const createAppTheme = (darkMode: boolean) =>
  createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#0969da',
      },
      secondary: {
        main: '#238636',
      },
      background: {
        default: darkMode ? '#0d1117' : '#f6f8fa',
        paper: darkMode ? '#161b22' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#e6edf3' : '#24292e',
      },
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    },
  });

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>('');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language;
    return saved || 'ru';
  });
  const [langMenuAnchor, setLangMenuAnchor] = useState<null | HTMLElement>(null);

  const t = translations[language];
  const theme = createAppTheme(darkMode);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    // Проверяем наличие токена при загрузке
    const token = localStorage.getItem('token');
    console.log('Проверяю токен при загрузке App:', token ? 'Найден' : 'Не найден');
    if (token) {
      setIsAuthenticated(true);
      // Пытаемся получить username из localStorage
      const savedUsername = localStorage.getItem('username');
      setUsername(savedUsername || 'Пользователь');
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.reload();
  };

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setLangMenuAnchor(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLangMenuAnchor(null);
  };

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    handleLanguageClose();
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <Typography variant="h6" color="textSecondary">
            {t.loading}
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* Header на странице авторизации */}
          <AppBar position="sticky">
            <Toolbar>
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <StorageIcon sx={{ fontSize: 32, mr: 2 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '18px' }}>
                    {t.fileRepository}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '11px' }}>
                    {t.tagline}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={handleLanguageClick} color="inherit">
                <LanguageIcon />
              </IconButton>
              <Menu
                anchorEl={langMenuAnchor}
                open={Boolean(langMenuAnchor)}
                onClose={handleLanguageClose}
              >
                <MenuItem
                  onClick={() => changeLanguage('ru')}
                  selected={language === 'ru'}
                >
                  🇷🇺 Русский
                </MenuItem>
                <MenuItem
                  onClick={() => changeLanguage('en')}
                  selected={language === 'en'}
                >
                  🇬🇧 English
                </MenuItem>
              </Menu>
              <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Toolbar>
          </AppBar>
          <Box sx={{ flexGrow: 1 }} />
          <AuthForm language={language} />
          <Box sx={{ flexGrow: 1 }} />
          {/* Footer на странице авторизации */}
          <Box
            component="footer"
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              py: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              {t.copyright}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {t.description}
            </Typography>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Header */}
        <AppBar position="sticky">
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <StorageIcon sx={{ fontSize: 32, mr: 2 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '18px' }}>
                  {t.fileRepository}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '11px' }}>
                  {t.tagline}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                👤 {username}
              </Typography>

              <IconButton onClick={handleLanguageClick} color="inherit" size="small">
                <LanguageIcon />
              </IconButton>
              <Menu
                anchorEl={langMenuAnchor}
                open={Boolean(langMenuAnchor)}
                onClose={handleLanguageClose}
              >
                <MenuItem
                  onClick={() => changeLanguage('ru')}
                  selected={language === 'ru'}
                >
                  🇷🇺 Русский
                </MenuItem>
                <MenuItem
                  onClick={() => changeLanguage('en')}
                  selected={language === 'en'}
                >
                  🇬🇧 English
                </MenuItem>
              </Menu>

              <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>

              <Button
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                size="small"
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {t.logout}
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Основной контент */}
        <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
          <RepoList language={language} />
        </Container>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            mt: 'auto',
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                py: 4,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {t.copyright}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {t.description}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 3 }}>
                <Typography
                  variant="caption"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  О проекте
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  •
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Помощь
                </Typography>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;