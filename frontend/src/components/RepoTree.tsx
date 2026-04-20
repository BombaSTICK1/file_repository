// frontend/src/components/RepoTree.tsx
import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper,
  Typography
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import client from '../api/client';
import FileUploadButton from './FileUploadButton';
import FolderUploadButton from './FolderUploadButton';
import CreateFolderButton from './CreateFolderButton';
import { DeleteRepoButton, DeleteItemButton } from './DeleteButtons';
import FileViewer from './FileViewer';


interface FolderNode {
  id: number;
  name: string;
  children: FolderNode[];
  files: { id: number; name: string; version_count: number }[];
}

interface RepoTreeProps {
  repoId: number;
  onRepoDeleted: () => void;
}

interface SelectedFile {
  id: number;
  name: string;
  version: number;
}

export default function RepoTree({ repoId, onRepoDeleted }: RepoTreeProps) {
  const [treeData, setTreeData] = useState<FolderNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

  useEffect(() => {
    loadTree();
  }, [repoId]);

  const loadTree = () => {
    client.get<FolderNode[]>(`/repos/${repoId}/tree`).then(res => {
      setTreeData(res.data);
    });
  };

  const toggleFolder = (id: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  const renderTree = (nodes: FolderNode[], depth = 0) => {
    return nodes.map(node => (
      <Box key={node.id} sx={{ ml: `${depth * 24}px`, my: 0.5 }}>
        {/* Папка */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            px: 1,
            py: 0.75,
            borderRadius: 2,
            transition: 'all 0.2s ease',
            '&:hover': { backgroundColor: 'rgba(37, 99, 235, 0.08)' }
          }}
        >

          <FolderIcon 
            sx={{ mr: 1.25, color: '#3b82f6', cursor: 'pointer' }} 

            onClick={() => toggleFolder(node.id)}
          />
          <Typography 
            onClick={() => toggleFolder(node.id)}
            sx={{ flexGrow: 1, cursor: 'pointer' }}
          >
            {node.name}
          </Typography>
          <DeleteItemButton type="folder" id={node.id} onDeleted={loadTree} />
        </Box>

        {/* Содержимое папки (если раскрыта) */}
        {expandedFolders.has(node.id) && (
          <Box sx={{ ml: 3, mb: 1 }}>
            {/* Кнопки действий */}
            <FileUploadButton 
              repoId={repoId} 
              folderId={node.id}
              onUploadComplete={loadTree} 
            />
            <FolderUploadButton 
              repoId={repoId} 
              folderId={node.id}
              onUploadComplete={loadTree} 
            />
            <CreateFolderButton 
              repoId={repoId} 
              parentId={node.id}
              onCreateComplete={loadTree} 
            />
            
            {/* Файлы */}
            {node.files.map(file => (
              <Box 
                key={file.id} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  py: 0.9,
                  px: 1.25,
                  '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px' },
                  cursor: 'pointer',
                  pl: 2,
                  borderRadius: 2,
                  transition: 'all 0.2s ease'
                }}

                onClick={() => setSelectedFile({ id: file.id, name: file.name, version: file.version_count })}
              >
                <InsertDriveFileIcon sx={{ mr: 1, fontSize: 16 }} />
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {file.name} (v{file.version_count})
                </Typography>
                <DeleteItemButton type="file" id={file.id} onDeleted={loadTree} />
              </Box>
            ))}
            {/* Вложенные папки */}
            {renderTree(node.children, depth + 1)}
          </Box>
        )}
      </Box>
    ));
  };

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.74)',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
      }}
    >

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 3,
          alignItems: 'center',
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >

        <Typography variant="h6">Содержимое репозитория</Typography>
        <Box>
          {/* Кнопки загрузки в корень (если есть корневая папка) */}
          {treeData.length > 0 && (
            <>
              <FileUploadButton 
                repoId={repoId} 
                folderId={treeData[0].id}
                onUploadComplete={loadTree} 
              />
              <FolderUploadButton 
                repoId={repoId} 
                folderId={treeData[0].id}
                onUploadComplete={loadTree} 
              />
              <CreateFolderButton 
                repoId={repoId} 
                parentId={treeData[0].id}
                onCreateComplete={loadTree} 
              />
            </>
          )}
          <DeleteRepoButton repoId={repoId} onDeleted={onRepoDeleted} />
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        {treeData.length > 0 ? renderTree(treeData) : (
          <Box
            sx={{
              py: 6,
              textAlign: 'center',
              color: 'text.secondary',
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.42)',
            }}
          >
            Репозиторий пуст
          </Box>
        )}

      </Box>

      {/* Просмотр содержимого файла */}
      {selectedFile && (
        <FileViewer 
          fileId={selectedFile.id}
          fileName={selectedFile.name}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </Paper>
  );
}