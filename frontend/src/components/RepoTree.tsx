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
import FileVersionList from './FileVersionList';
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
            '&:hover': { backgroundColor: '#f6f8fa', borderRadius: '4px' }
          }}
        >
          <FolderIcon 
            sx={{ mr: 1, color: '#58a6ff', cursor: 'pointer' }} 
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
                  py: 0.5,
                  '&:hover': { backgroundColor: '#f6f8fa', borderRadius: '4px' },
                  cursor: 'pointer',
                  pl: 2
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
    <Paper sx={{ p: 2, border: '1px solid #e1e4e8' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
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
        {treeData.length > 0 ? renderTree(treeData) : 'Репозиторий пуст'}
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