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
    <Paper sx={{ p: 3, mb: 3, border: '1px solid #e1e4e8' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Создать новый репозиторий</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Название репозитория"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Box>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={!name.trim() || loading}
            sx={{ mr: 1 }}
          >
            {loading ? 'Создание...' : 'Создать'}
          </Button>
          <Button onClick={onCancel}>Отмена</Button>
        </Box>
      </form>
    </Paper>
  );
}