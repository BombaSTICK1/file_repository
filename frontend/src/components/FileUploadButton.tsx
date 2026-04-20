import { useRef, useState } from 'react';
import { 
  Box,
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  Typography
} from '@mui/material';

import client from '../api/client';

interface FileUploadButtonProps {
  repoId: number;
  folderId: number; // Обязательный ID папки
  onUploadComplete: () => void;
}

export default function FileUploadButton({ 
  repoId, 
  folderId, 
  onUploadComplete 
}: FileUploadButtonProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError('');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0] || null;
    if (droppedFile) {
      setFile(droppedFile);
      setError('');
    }
  };


  const handleSubmit = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('folder_id', folderId.toString());
    formData.append('file', file);

    try {
      await client.post(`/repos/${repoId}/upload-file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUploadComplete();
      setOpen(false);
      setFile(null);
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Не удалось загрузить файл');
    } finally {
      setUploading(false);
    }

  };

  return (
    <>
      <Button 
        variant="outlined" 
        size="small"
        onClick={() => setOpen(true)}
        sx={{
          mr: 1,
          borderColor: 'divider',
          backgroundColor: 'rgba(255,255,255,0.72)',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.92)',
          },
        }}
      >
        Upload File
      </Button>
      
      
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>

        <DialogTitle>Загрузка файла</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Перетащите файл сюда или выберите его вручную
          </Typography>
          <Box
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            sx={{
              border: '2px dashed',
              borderColor: dragActive ? 'primary.main' : 'divider',
              borderRadius: 4,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              background: dragActive
                ? 'linear-gradient(135deg, rgba(37,99,235,0.10), rgba(59,130,246,0.06))'
                : 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(248,250,252,0.88))',
              transition: 'all 0.2s ease',
            }}

          >
            <input
              ref={inputRef}
              hidden
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <Typography variant="body2">
              {file ? `Выбран файл: ${file.name}` : 'Нажмите или перетащите файл'}
            </Typography>
          </Box>
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpen(false)} 
            disabled={uploading}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!file || uploading}
            variant="contained"
            color="primary"
            sx={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
              },
            }}
          >
            {uploading ? 'Загрузка...' : 'Загрузить'}

          </Button>
        </DialogActions>

      </Dialog>
    </>
  );
}