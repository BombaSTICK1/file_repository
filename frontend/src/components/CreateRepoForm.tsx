import { useState } from 'react';
import { 
  TextField, 
  Button, 
  Box, 
  Paper,
  Typography
} from '@mui/material';
import client from '../api/client';


interface CreateRepoFormProps {
  onRepoCreated: () => void;
  onCancel: () => void;
}

export default function CreateRepoForm({ onRepoCreated, onCancel }: CreateRepoFormProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await client.post('/repos/', { name });
      onRepoCreated();
    } catch (error) {
      console.error('Ошибка создания репозитория:', error);
      alert('Не удалось создать репозиторий');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.74)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)',
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>Создать новый репозиторий</Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          label="Название репозитория"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.76)',
            },
          }}

        />
        <Box>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={!name.trim() || loading}
            sx={{
              mr: 1,
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              boxShadow: '0 14px 24px rgba(37, 99, 235, 0.16)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
              },
            }}

          >
            {loading ? 'Создание...' : 'Создать'}
          </Button>
          <Button onClick={onCancel}>Отмена</Button>
        </Box>
      </form>
    </Paper>
  );
}