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
        main: '#2563eb',
      },
      secondary: {
        main: '#10b981',
      },
      background: {
        default: darkMode ? '#0b1220' : '#f4f7fb',
        paper: darkMode ? '#111827' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#e5eefc' : '#172033',
        secondary: darkMode ? '#9fb0cc' : '#5b6b82',
      },
      divider: darkMode ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.22)',
    },
    shape: {
      borderRadius: 16,
    },
    typography: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      h5: {
        fontWeight: 700,
      },
      h6: {
        fontWeight: 700,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: darkMode
              ? 'linear-gradient(135deg, rgba(17,24,39,0.95), rgba(30,41,59,0.9))'
              : 'linear-gradient(135deg, rgba(37,99,235,0.96), rgba(59,130,246,0.92))',
            backdropFilter: 'blur(14px)',
            boxShadow: darkMode
              ? '0 10px 40px rgba(0, 0, 0, 0.35)'
              : '0 10px 30px rgba(37, 99, 235, 0.18)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            paddingInline: 14,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            boxShadow: darkMode
              ? '0 12px 30px rgba(0, 0, 0, 0.28)'
              : '0 10px 30px rgba(15, 23, 42, 0.08)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
          },
        },
      },
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
          <AppBar position="sticky">
            <Toolbar sx={{ minHeight: 72 }}>

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
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 2,
              py: { xs: 4, md: 8 },
            }}
          >
            <AuthForm language={language} />
          </Box>

          {/* Footer на странице авторизации */}
          <Box
            component="footer"
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              py: 3,
              textAlign: 'center',
              backgroundColor: 'rgba(255,255,255,0.45)',
              backdropFilter: 'blur(10px)',
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
        <AppBar position="sticky">
          <Toolbar sx={{ minHeight: 74 }}>

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
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 }, flexGrow: 1 }}>
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
          <Container maxWidth="xl">
            <Box
              sx={{
                py: 4,
                textAlign: 'center',
                backgroundColor: 'rgba(255,255,255,0.35)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                my: 2,
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