// frontend/src/components/FolderUpload.tsx
import { useState } from 'react';
import { 
  Button, 
  Box, 
  Typography,
  Alert
} from '@mui/material';
import client from '../api/client';

interface FolderUploadProps {
  repoId: number;
  onUploadComplete: () => void;
}

export default function FolderUpload({ repoId, onUploadComplete }: FolderUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.zip')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Пожалуйста, загрузите ZIP-архив');
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('repo_id', repoId.toString());
    formData.append('file', file);

    setUploading(true);
    try {
      // TODO: Реализовать endpoint /api/repos/{repo_id}/upload-zip на бэкенде
      await client.post(`/repos/${repoId}/upload-zip`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUploadComplete();
      setFile(null);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError('Не удалось загрузить архив');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px dashed #d0d7de', borderRadius: 1 }}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Загрузите ZIP-архив с содержимым проекта
      </Typography>
      <input 
        type="file" 
        accept=".zip" 
        onChange={handleFileChange}
        disabled={uploading}
      />
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>
      )}
      <Button 
        variant="contained" 
        size="small"
        onClick={handleSubmit}
        disabled={!file || uploading}
        sx={{ mt: 1 }}
      >
        {uploading ? 'Загрузка...' : 'Распаковать в репозиторий'}
      </Button>
    </Box>
  );
}