// frontend/src/components/DeleteButtons.tsx
import { Button } from '@mui/material';
import client from '../api/client';

interface DeleteRepoButtonProps {
  repoId: number;
  onDeleted: () => void;
}

export function DeleteRepoButton({ repoId, onDeleted }: DeleteRepoButtonProps) {
  const handleDelete = async () => {
    if (window.confirm('Delete this repository? This cannot be undone.')) {
      try {
        await client.delete(`/repos/${repoId}`);
        onDeleted();
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete repository');
      }
    }
  };

  return (
    <Button 
      variant="outlined" 
      color="error" 
      size="small"
      onClick={handleDelete}
    >
      Delete Repository
    </Button>
  );
}

interface DeleteItemButtonProps {
  type: 'folder' | 'file';
  id: number;
  onDeleted: () => void;
}

export function DeleteItemButton({ type, id, onDeleted }: DeleteItemButtonProps) {
  const handleDelete = async () => {
    if (window.confirm(`Delete this ${type}?`)) {
      try {
        await client.delete(`/${type}s/${id}`);
        onDeleted();
      } catch (error) {
        console.error('Delete error:', error);
        alert(`Failed to delete ${type}`);
      }
    }
  };

  return (
    <Button 
      variant="outlined" 
      color="error" 
      size="small"
      onClick={handleDelete}
      sx={{ ml: 1 }}
    >
      Delete
    </Button>
  );
}