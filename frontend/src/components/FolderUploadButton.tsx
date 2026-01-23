// frontend/src/components/FolderUploadButton.tsx
import { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  Typography,
  LinearProgress
} from '@mui/material';
import client from '../api/client';
import { Box } from '@mui/material';

interface FolderUploadButtonProps {
  repoId: number;
  folderId: number;
  onUploadComplete: () => void;
}

export default function FolderUploadButton({ 
  repoId, 
  folderId, 
  onUploadComplete 
}: FolderUploadButtonProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const items = e.target.files;
    if (!items || items.length === 0) return;

    setUploading(true);
    setProgress(0);
    
    try {
      // Собираем все файлы с относительными путями
      const filesWithPaths: { file: File; relativePath: string }[] = [];
      
      for (let i = 0; i < items.length; i++) {
        const file = items[i];
        // @ts-ignore
        const relativePath = file.webkitRelativePath || file.name;
        filesWithPaths.push({ file, relativePath });
      }

      // Загружаем файлы по одному
      for (let i = 0; i < filesWithPaths.length; i++) {
        const { file, relativePath } = filesWithPaths[i];
        const formData = new FormData();
        formData.append('folder_id', folderId.toString());
        formData.append('relative_path', relativePath);
        formData.append('file', file);

        await client.post(`/repos/${repoId}/upload-file-with-path`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setProgress(Math.round(((i + 1) / filesWithPaths.length) * 100));
      }

      onUploadComplete();
      setOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload folder');
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
        sx={{ mr: 1 }}
      >
        Upload Folder
      </Button>
      
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Upload Folder</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select a folder to upload its contents
          </Typography>
            <input 
            type="file" 
            // @ts-ignore
            webkitdirectory="true"
            // @ts-ignore
            directory="true"
            multiple
            onChange={handleFolderSelect}
            disabled={uploading}
            />
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">Uploading... {progress}%</Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={uploading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}