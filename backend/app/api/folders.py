from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Folder, FileVersion, File, Repository, User
from pydantic import BaseModel
import os
import shutil
from pathlib import Path
from .deps import get_current_user

router = APIRouter()

# Путь к хранилищу файлов
STORAGE_PATH = Path("storage")
STORAGE_PATH.mkdir(exist_ok=True)

class FolderCreate(BaseModel):
    name: str
    parent_id: int | None = None
    repository_id: int  # ← обязательно!

class FolderResponse(BaseModel):
    id: int
    name: str
    parent_id: int | None

    class Config:
        from_attributes = True  # Pydantic v2 (ранее orm_mode = True)

@router.post("/", response_model=FolderResponse)
def create_folder(folder: FolderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Проверяем права доступа к репозиторию
    repo = db.query(Repository).filter(Repository.id == folder.repository_id, Repository.owner_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db_folder = Folder(
        name=folder.name,
        parent_id=folder.parent_id,
        repository_id=folder.repository_id
    )
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

@router.get("/", response_model=list[FolderResponse])
def get_folders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Folder)\
             .join(Repository)\
             .filter(Repository.owner_id == current_user.id)\
             .all()

@router.get("/tree")
def get_folder_tree(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    root_folders = db.query(Folder)\
                     .join(Repository)\
                     .filter(Folder.parent_id.is_(None), Repository.owner_id == current_user.id)\
                     .all()
    return [folder.to_dict() for folder in root_folders]

@router.delete("/{folder_id}")
def delete_folder(folder_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Находим папку и проверяем права доступа
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Проверяем права доступа к репозиторию
    repo = db.query(Repository).filter(Repository.id == folder.repository_id, Repository.owner_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=403, detail="Access denied")
    
    delete_recursive(folder_id, db)
    db.commit()
    return {"message": "Folder deleted"}

def delete_recursive(folder_id: int, db: Session):
    """
    Рекурсивно удаляет папку и всё её содержимое
    """
    # Удаляем вложенные папки
    children = db.query(Folder).filter(Folder.parent_id == folder_id).all()
    for child in children:
        delete_recursive(child.id, db)
    
    # Удаляем файлы в папке
    files = db.query(File).filter(File.folder_id == folder_id).all()
    for file in files:
        # Удаляем версии с диска
        versions = db.query(FileVersion).filter(FileVersion.file_id == file.id).all()
        for ver in versions:
            if os.path.exists(ver.file_path):
                os.remove(ver.file_path)
            db.delete(ver)
        
        # Удаляем папку файла
        file_dir = STORAGE_PATH / str(file.id)
        if file_dir.exists():
            shutil.rmtree(file_dir)
        
        db.delete(file)
    
    # Удаляем саму папку
    db.query(Folder).filter(Folder.id == folder_id).delete()