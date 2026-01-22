import { useEffect, useState } from 'react';
import client from '../api/client';
import FileUploadForm from './FileUploadForm';
import FileVersionList from './FileVersionList';

interface FolderNode {
  id: number;
  name: string;
  children: FolderNode[];
  files: { id: number; name: string; version_count: number }[];
}

export default function FolderTree() {
  const [treeData, setTreeData] = useState<FolderNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);

  useEffect(() => {
    client.get<FolderNode[]>('/folders/tree').then(res => {
      setTreeData(res.data);
    });
  }, []);

  const handleFolderClick = (id: number) => {
    setSelectedFolderId(id);
    setSelectedFileId(null); // Скрыть версии при выборе папки
  };

  const handleFileClick = (fileId: number) => {
    setSelectedFileId(fileId);
    setSelectedFolderId(null); // Скрыть форму загрузки при выборе файла
  };

  const handleUploadSuccess = () => {
    // Перезагружаем дерево после загрузки файла
    client.get<FolderNode[]>('/folders/tree').then(res => {
      setTreeData(res.data);
    });
  };

  const renderTree = (nodes: FolderNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id} style={{ marginLeft: `${depth * 20}px` }}>
        {/* Кликабельная папка */}
        <div
          onClick={() => handleFolderClick(node.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '4px 0',
            backgroundColor: selectedFolderId === node.id ? '#e3f2fd' : 'transparent',
            borderRadius: '4px',
          }}
        >
          <span>📁 </span>
          <span>{node.name}</span>
        </div>

        {/* Файлы */}
        {node.files.map(file => (
          <div
            key={file.id}
            onClick={() => handleFileClick(file.id)}
            style={{
              marginLeft: '20px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '2px 0',
              backgroundColor: selectedFileId === file.id ? '#e8f5e9' : 'transparent',
              borderRadius: '4px',
            }}
          >
            <span>📄 </span>
            <span>{file.name} (v{file.version_count})</span>
          </div>
        ))}

        {/* Форма загрузки (если папка выбрана) */}
        {selectedFolderId === node.id && (
          <div style={{ marginLeft: '20px', marginTop: '8px' }}>
            <FileUploadForm folderId={node.id} onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {/* Вложенные папки */}
        {renderTree(node.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div>
      {renderTree(treeData)}

      {/* Список версий (если файл выбран) */}
      {selectedFileId && (
        <div style={{ marginTop: '16px' }}>
          <FileVersionList
            fileId={selectedFileId}
            onClose={() => setSelectedFileId(null)}
          />
        </div>
      )}
    </div>
  );
}