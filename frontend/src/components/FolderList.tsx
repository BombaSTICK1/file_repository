import { useEffect, useState } from 'react';
import client from '../api/client';
import type { Folder } from '../types'; // ← добавь 'type' здесь

export default function FolderList() {
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    client.get<Folder[]>('/folders/').then(res => setFolders(res.data));
  }, []);

  return (
    <div>
      <h2>Папки</h2>
      <ul>
        {folders.map(f => (
          <li key={f.id}>{f.name}</li>
        ))}
      </ul>
    </div>
  );
}