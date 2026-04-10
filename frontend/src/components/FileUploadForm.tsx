import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import client from '../api/client';

interface FileUploadFormProps {
  folderId: number;
  onUploadSuccess: () => void;
}

export default function FileUploadForm({ folderId, onUploadSuccess }: FileUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Выберите файл');
      return;
    }

    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('folder_id', folderId.toString());
    formData.append('file', file);

    try {
      await client.post('/files/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Файл успешно загружен!');
      onUploadSuccess();
      setFile(null);
      setCommitMessage('');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Не удалось загрузить файл';
      setError(errorMsg);
      console.error('Ошибка загрузки:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        mt: 2,
        p: 2,
        border: '1px solid #e1e4e8',
        borderRadius: '6px',
        backgroundColor: '#f6f8fa',
      }}
    >
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          component="label"
          startIcon={<CloudUploadIcon />}
          sx={{ mr: 2 }}
        >
          Выбрать файл
          <input
            hidden
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </Button>
        {file && (
          <Box component="span" sx={{ ml: 1, color: '#57606a' }}>
            {file.name}
          </Box>
        )}
      </Box>

      <TextField
        fullWidth
        label="Описание загрузки (опционально)"
        placeholder="Краткое описание изменений файла"
        value={commitMessage}
        onChange={(e) => setCommitMessage(e.target.value)}
        disabled={uploading}
        size="small"
        sx={{ mb: 2 }}
      />

      <Button
        type="submit"
        variant="contained"
        disabled={!file || uploading}
        sx={{
          backgroundColor: '#238636',
          '&:hover': { backgroundColor: '#2ea043' },
        }}
      >
        {uploading ? <CircularProgress size={24} /> : 'Загрузить'}
      </Button>
    </Box>
  );
}