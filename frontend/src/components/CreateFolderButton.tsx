// frontend/src/components/CreateFolderButton.tsx
import { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  TextField
} from '@mui/material';
import client from '../api/client';

interface CreateFolderButtonProps {
  repoId: number;
  parentId: number | null;
  onCreateComplete: () => void;
}

export default function CreateFolderButton({ 
  repoId, 
  parentId, 
  onCreateComplete 
}: CreateFolderButtonProps) {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState('');

  const handleSubmit = async () => {
    if (!folderName.trim()) return;

    try {
      await client.post('/folders/', {
        name: folderName.trim(),
        parent_id: parentId,
        repository_id: repoId
      });
      onCreateComplete();
      setOpen(false);
      setFolderName('');
    } catch (error) {
      console.error('Create folder error:', error);
      alert('Failed to create folder');
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
        Create Folder
      </Button>
      
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            label="Folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!folderName.trim()}
            variant="contained"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}