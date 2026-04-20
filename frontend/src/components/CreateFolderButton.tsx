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
        sx={{
          mr: 1,
          borderColor: 'divider',
          backgroundColor: 'rgba(255,255,255,0.72)',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.92)',
          },
        }}
      >
        Create Folder
      </Button>
      
      
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>

        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            label="Folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            fullWidth
            autoFocus
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.72)',
              },
            }}
          />

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!folderName.trim()}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
              },
            }}
          >
            Create

          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}