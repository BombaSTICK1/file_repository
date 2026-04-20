// frontend/src/components/FileViewer.tsx
import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Alert,
  TextField,
  Card,
  CardContent,
} from '@mui/material';
import CompareIcon from '@mui/icons-material/Compare';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import client from '../api/client';

interface FileVersion {
  id: number;
  version_number: number;
  commit_message: string;
  file_path: string;
}

interface FileViewerProps {
  fileId: number;
  fileName: string;
  onClose: () => void;
}

export default function FileViewer({ fileId, fileName, onClose }: FileViewerProps) {
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number>(1);
  const [content, setContent] = useState<string>('');
  const [diffContent, setDiffContent] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [compareWith, setCompareWith] = useState<number | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [fileId]);

  useEffect(() => {
    if (versions.length > 0) {
      const hasSelectedVersion = versions.some((version) => version.version_number === selectedVersion);
      const versionToLoad = hasSelectedVersion ? selectedVersion : versions[0].version_number;

      if (versionToLoad !== selectedVersion) {
        setSelectedVersion(versionToLoad);
        return;
      }

      loadContent(versionToLoad);
    }
  }, [selectedVersion, versions]);


  const loadVersions = async () => {
    setLoading(true);
    setError('');
    setContent('');
    try {
      const res = await client.get(`/files/${fileId}/versions`);
      setVersions(res.data);
      if (res.data.length > 0) {
        setSelectedVersion(res.data[0].version_number);
      }
    } catch (err: any) {

      const errorMsg = err.response?.data?.detail || 'Ошибка при загрузке версий';
      setError(errorMsg);

    } finally {
      setLoading(false);
    }
  };

  const loadContent = async (versionNumber: number) => {
    setError('');
    try {
      const res = await client.get(`/files/${fileId}/versions/${versionNumber}/content`);
      setContent(res.data.content ?? '');
    } catch (err: any) {

      const errorMsg = err.response?.data?.detail || 'Ошибка при загрузке содержимого';
      setError(errorMsg);

    }
  };

  const handleCompare = async (version1: number, version2: number) => {
    try {
      const res = await client.get(`/files/${fileId}/versions/${version1}/compare/${version2}`);
      setDiffContent(res.data.diff);
      setShowDiff(true);
    } catch (err: any) {
      setError('Ошибка при сравнении версий');

    }
  };

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Выберите файл');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('commit_message', commitMessage);

    try {
      await client.post(`/files/${fileId}/upload-version`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await loadVersions();
      setUploadFile(null);
      setCommitMessage('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Ошибка при загрузке версии';
      setError(errorMsg);

    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 3, border: '1px solid #e1e4e8' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">📄 {fileName}</Typography>
        <Button onClick={onClose} variant="outlined" size="small">
          Закрыть
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 2 }}>
        {/* Список версий */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            📋 Версии ({versions.length})
          </Typography>
          <List
            sx={{
              border: '1px solid #e1e4e8',
              borderRadius: '6px',
              maxHeight: '400px',
              overflow: 'auto',
            }}
          >
            {versions.map((v) => (
              <Box key={v.id}>
                <ListItemButton
                  selected={selectedVersion === v.version_number}
                  onClick={() => setSelectedVersion(v.version_number)}
                  sx={{
                    pl: 1.5,
                    pr: 1,
                    py: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: '#e8f5e9',
                    },
                  }}
                >
                  <ListItemText
                    primary={`v${v.version_number}`}
                    secondary={v.commit_message}
                    primaryTypographyProps={{ variant: 'caption', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                  />
                </ListItemButton>
                <Divider />
              </Box>
            ))}
          </List>

          {/* Кнопка загрузки новой версии */}
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
            ⬆️ Новая версия
          </Typography>
          <Box component="form" onSubmit={handleUploadVersion}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
              size="small"
              sx={{ mb: 1 }}
            >
              Выбрать файл
              <input
                hidden
                type="file"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setUploadFile(e.target.files[0]);
                  }
                }}
                disabled={uploading}
              />
            </Button>
            {uploadFile && (
              <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#57606a' }}>
                {uploadFile.name}
              </Typography>
            )}
            <TextField
              fullWidth
              label="Коммит"
              placeholder="Описание изменений"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              disabled={uploading}
              size="small"
              sx={{ mb: 1 }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!uploadFile || uploading}
              fullWidth
              size="small"
              sx={{ backgroundColor: '#238636' }}
            >
              {uploading ? <CircularProgress size={20} /> : 'Загрузить'}
            </Button>
          </Box>
        </Box>

        {/* Содержимое и diff */}
        <Box>
          {showDiff ? (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowDiff(false)}
                >
                  Закрыть diff
                </Button>
              </Box>
              <Box
                sx={{
                  backgroundColor: '#f6f8fa',
                  border: '1px solid #d0d7de',
                  borderRadius: '6px',
                  p: 2,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  maxHeight: '500px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {diffContent.map((line, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      color: line.startsWith('+')
                        ? '#28a745'
                        : line.startsWith('-')
                          ? '#d73a49'
                          : '#24292e',
                      backgroundColor:
                        line.startsWith('+')
                          ? '#f0fff4'
                          : line.startsWith('-')
                            ? '#ffeef0'
                            : 'transparent',
                    }}
                  >
                    {line}
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                  v{selectedVersion}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {compareWith !== null && compareWith !== selectedVersion && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CompareIcon />}
                      onClick={() => handleCompare(compareWith, selectedVersion)}
                      sx={{ backgroundColor: '#0969da' }}
                    >
                      Сравнить
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      setCompareWith(compareWith === selectedVersion ? null : selectedVersion)
                    }
                  >
                    {compareWith === selectedVersion ? 'Отмена' : 'Выбрать для diff'}
                  </Button>
                </Box>
              </Box>

              <Card variant="outlined">
                <CardContent>
                  <Box
                    sx={{
                      backgroundColor: '#f6f8fa',
                      border: '1px solid #d0d7de',
                      borderRadius: '6px',
                      p: 2,
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      maxHeight: '500px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: '1.5',
                      color: '#24292e',
                    }}
                  >
                    {content || '[Файл пустой]'}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
