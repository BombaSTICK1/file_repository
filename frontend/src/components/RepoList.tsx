// frontend/src/components/RepoList.tsx
import { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Button,
  Paper,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Fab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import client from '../api/client';
import CreateRepoForm from './CreateRepoForm';
import RepoTree from './RepoTree';
import { translations, type Language } from '../translations';

interface Repository {
  id: number;
  name: string;
}

interface RepoListProps {
  language: Language;
}

export default function RepoList({ language }: RepoListProps) {
  const t = translations[language];
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
      {/* Если репозиторий выбран, показываем его содержимое */}
      {selectedRepoId ? (
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3,
              pb: 2,
              borderBottom: '1px solid #d0d7de',
            }}
          >
            <FolderIcon sx={{ mr: 2, color: '#0969da', fontSize: 32 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {repos.find(r => r.id === selectedRepoId)?.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t.repositories}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => setSelectedRepoId(null)}
              sx={{
                borderColor: '#d0d7de',
                color: '#24292e',
                '&:hover': {
                  backgroundColor: '#f6f8fa',
                },
              }}
            >
              ← {t.backToList}
            </Button>
          </Box>

          <RepoTree
            repoId={selectedRepoId}
            onRepoDeleted={handleRepoDeleted}
          />
        </Box>
      ) : (
        <Box>
          {/* Кнопка создания репозитория */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              pb: 2,
              borderBottom: '1px solid #d0d7de',
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                {t.myRepositories}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {repos.length} {t.repositories}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateForm(true)}
              sx={{
                backgroundColor: '#238636',
                '&:hover': {
                  backgroundColor: '#2ea043',
                },
                fontWeight: 600,
              }}
            >
              {t.createRepo}
            </Button>
          </Box>

          {showCreateForm && (
            <Box sx={{ mb: 3 }}>
              <CreateRepoForm
                onRepoCreated={handleRepoCreated}
                onCancel={() => setShowCreateForm(false)}
              />
            </Box>
          )}

          {/* Список репозиториев */}
          {repos.length === 0 ? (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                backgroundColor: '#f6f8fa',
                border: '1px dashed #d0d7de',
                borderRadius: 2,
              }}
            >
              <FolderIcon
                sx={{
                  fontSize: 48,
                  color: '#d0d7de',
                  mb: 2,
                }}
              />
              <Typography variant="h6" sx={{ mb: 1, color: '#57606a' }}>
                {t.noRepos}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {t.createFirst}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateForm(true)}
                sx={{
                  backgroundColor: '#0969da',
                  '&:hover': {
                    backgroundColor: '#0860ca',
                  },
                }}
              >
                {t.createRepo}
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {repos.map(repo => (
                <Grid item xs={12} sm={6} md={4} key={repo.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      border: '1px solid #d0d7de',
                      '&:hover': {
                        boxShadow: '0 3px 12px rgba(0, 0, 0, 0.15)',
                        borderColor: '#0969da',
                        transform: 'translateY(-4px)',
                      },
                      cursor: 'pointer',
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <FolderIcon
                          sx={{
                            mr: 1.5,
                            color: '#0969da',
                            fontSize: 28,
                          }}
                        />
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: '#24292e',
                            wordBreak: 'break-word',
                          }}
                        >
                          {repo.name}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                          ml: 4.5,
                        }}
                      >
                        Нажмите для открытия
                      </Typography>
                    </CardContent>

                    <CardActions
                      sx={{
                        pt: 0,
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Button
                        size="small"
                        onClick={() => handleRepoClick(repo.id)}
                        sx={{
                          color: '#0969da',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: '#f6f8fa',
                          },
                        }}
                      >
                        Открыть →
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
    </Box>
  );
}