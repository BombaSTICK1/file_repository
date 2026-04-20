// frontend/src/components/RepoList.tsx
import { useState, useEffect } from 'react';
import {
  Button,
  Paper,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';

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
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
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
                borderColor: 'divider',
                color: 'text.primary',
                backgroundColor: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.92)',
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
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
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
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: '0 14px 26px rgba(37, 99, 235, 0.18)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
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
                p: 5,
                textAlign: 'center',
                backgroundColor: 'rgba(255,255,255,0.72)',
                border: '1px dashed rgba(148, 163, 184, 0.45)',
                borderRadius: 5,
                backdropFilter: 'blur(14px)',
              }}
            >

              <FolderIcon
                sx={{
                  fontSize: 48,
                  color: '#94a3b8',

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
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  boxShadow: '0 14px 26px rgba(37, 99, 235, 0.18)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
                  },

                }}
              >
                {t.createRepo}
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {repos.map(repo => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={repo.id}>

                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      border: '1px solid rgba(148, 163, 184, 0.22)',
                      backgroundColor: 'rgba(255,255,255,0.76)',
                      backdropFilter: 'blur(12px)',
                      '&:hover': {
                        boxShadow: '0 18px 38px rgba(15, 23, 42, 0.12)',
                        borderColor: '#2563eb',
                        transform: 'translateY(-6px)',
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
                            color: '#2563eb',

                            fontSize: 28,
                          }}
                        />
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: 'text.primary',

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
Нажмите, чтобы открыть

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