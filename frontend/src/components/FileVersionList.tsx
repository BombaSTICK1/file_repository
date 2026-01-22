// frontend/src/components/FileVersionList.tsx
import { useEffect, useState } from 'react';
import client from '../api/client';

interface FileVersion {
  id: number;
  version_number: number;
  created_at: string;
}

interface FileVersionListProps {
  fileId: number;
  onClose: () => void;
}

export default function FileVersionList({ fileId, onClose }: FileVersionListProps) {
  const [versions, setVersions] = useState<FileVersion[]>([]);

  useEffect(() => {
    client.get(`/files/${fileId}/versions`).then(res => {
      setVersions(res.data);
    });
  }, [fileId]);

  const handleDownload = (versionNumber: number) => {
    window.open(`http://127.0.0.1:8000/api/files/${fileId}/versions/${versionNumber}`, '_blank');
  };

  return (
    <div style={{
      border: '1px solid #ccc',
      padding: '16px',
      marginTop: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h4>Версии файла</h4>
      <button onClick={onClose} style={{ float: 'right', marginBottom: '8px' }}>
        Закрыть
      </button>
      <div style={{ clear: 'both' }}>
        {versions.map(v => (
          <div key={v.id} style={{ marginBottom: '4px' }}>
            <span>v{v.version_number} ({new Date(v.created_at).toLocaleString()})</span>
            <button
              onClick={() => handleDownload(v.version_number)}
              style={{ marginLeft: '8px' }}
            >
              Скачать
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}