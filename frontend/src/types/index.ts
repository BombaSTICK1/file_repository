export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
}

export interface File {
  id: number;
  name: string;
  folder_id: number;
  version_count: number;
}

export interface FileVersion {
  id: number;
  file_id: number;
  version_number: number;
  created_at: string;
}