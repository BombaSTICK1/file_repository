import { useState } from 'react';
import client from '../api/client';

interface FileUploadFormProps {
  folderId: number;
  onUploadSuccess: () => void;
}

export default function FileUploadForm({ folderId, onUploadSuccess }: FileUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('folder_id', folderId.toString());
    formData.append('file', file);

    try {
      await client.post('/files/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Файл успешно загружен!');
      onUploadSuccess(); // Обновить список файлов
      setFile(null);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('Не удалось загрузить файл');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
      <input type="file" onChange={handleFileChange} disabled={uploading} />
      <button type="submit" disabled={!file || uploading} style={{ marginLeft: '8px' }}>
        {uploading ? 'Загрузка...' : 'Загрузить'}
      </button>
    </form>
  );
}