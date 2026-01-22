import { useState } from 'react';
import { 
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
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
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Check console for details.');
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
        Upload File
      </Button>
      
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Upload File to Folder</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select a file to upload to this folder
          </Typography>
          <input 
            type="file" 
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected: {file.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpen(false)} 
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!file || uploading}
            variant="contained"
            color="primary"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}