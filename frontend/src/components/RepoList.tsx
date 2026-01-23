// frontend/src/components/RepoList.tsx
import { useState, useEffect } from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  Button,
  Paper,
  Box
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import client from '../api/client';
import CreateRepoForm from './CreateRepoForm';
import RepoTree from './RepoTree';

interface Repository {
  id: number;
  name: string;
}

export default function RepoList() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = () => {
    client.get<Repository[]>('/repos/').then(res => setRepos(res.data));
  };

  const handleRepoClick = (id: number) => {
    setSelectedRepoId(id);
  };

  const handleRepoCreated = () => {
    loadRepositories();
    setShowCreateForm(false);
  };

  const handleRepoDeleted = () => {
    setSelectedRepoId(null);
    loadRepositories();
  };

  return (
    <Box>
      {/* Кнопка создания репозитория */}
      <Button 
        variant="contained" 
        onClick={() => setShowCreateForm(true)}
        sx={{ mb: 3 }}
      >
        + New Repository
      </Button>

      {showCreateForm && (
        <CreateRepoForm 
          onRepoCreated={handleRepoCreated} 
          onCancel={() => setShowCreateForm(false)} 
        />
      )}

      {/* Список репозиториев */}
      <Paper elevation={0} sx={{ border: '1px solid #e1e4e8', borderRadius: '6px' }}>
        <List>
          {repos.map(repo => (
            <ListItem 
              component="div"
              key={repo.id}
              onClick={() => handleRepoClick(repo.id)}
              sx={{
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#f6f8fa' },
                borderBottom: '1px solid #eaecef'
              }}
            >
              <FolderIcon sx={{ mr: 2, color: '#58a6ff' }} />
              <ListItemText 
                primary={repo.name}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      

      {/* Дерево выбранного репозитория */}
      {selectedRepoId && (
        <Box sx={{ mt: 4 }}>
          <RepoTree 
            repoId={selectedRepoId} 
            onRepoDeleted={handleRepoDeleted} 
          />
        </Box>
      )}
    </Box>
  );
}