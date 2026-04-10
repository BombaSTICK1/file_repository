# backend/app/schemas.py
from pydantic import BaseModel
from typing import Optional

# User Schemas
class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True

# Repository Schemas
class RepositoryCreate(BaseModel):
    name: str

class RepositoryOut(BaseModel):
    id: int
    name: str
    owner_id: int

    class Config:
        from_attributes = True

# Folder Schemas
class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None
    repository_id: int

class FolderOut(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None
    repository_id: int

    class Config:
        from_attributes = True

# File Schemas
class FileOut(BaseModel):
    id: int
    name: str
    folder_id: int
    version_count: int

    class Config:
        from_attributes = True

# File Version Schemas
class FileVersionOut(BaseModel):
    id: int
    version_number: int
    file_path: str
    commit_message: Optional[str] = None

    class Config:
        from_attributes = True
