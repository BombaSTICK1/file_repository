// frontend/src/components/DeleteButtons.tsx
import { Button, IconButton, Tooltip } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import client from '../api/client';

interface DeleteRepoButtonProps {
  repoId: number;
  onDeleted: () => void;
}

export function DeleteRepoButton({ repoId, onDeleted }: DeleteRepoButtonProps) {
  const handleDelete = async () => {
    if (window.confirm('Удалить репозиторий? Это действие нельзя отменить.')) {
      try {
        await client.delete(`/repos/${repoId}`);
        onDeleted();
      } catch {
        alert('Не удалось удалить репозиторий');
      }
    }

  };

  return (
    <Button 
      variant="outlined" 
      color="error" 
      size="small"
      onClick={handleDelete}
      startIcon={<DeleteOutlineIcon />}
      sx={{
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.72)',
      }}
    >
      Удалить репозиторий
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
    if (window.confirm(type === 'folder' ? 'Удалить папку?' : 'Удалить файл?')) {
      try {
        await client.delete(`/${type}s/${id}`);
        onDeleted();
      } catch {
        alert(type === 'folder' ? 'Не удалось удалить папку' : 'Не удалось удалить файл');
      }
    }

  };

  return (
    <Tooltip title={type === 'folder' ? 'Удалить папку' : 'Удалить файл'}>
      <IconButton
        color="error"
        size="small"
        onClick={handleDelete}
        sx={{
          ml: 1,
          border: '1px solid',
          borderColor: 'rgba(239, 68, 68, 0.24)',
          backgroundColor: 'rgba(255,255,255,0.6)',
          '&:hover': {
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
          },
        }}
      >
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

}