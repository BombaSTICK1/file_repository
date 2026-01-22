import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import RepoList from './components/RepoList';

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