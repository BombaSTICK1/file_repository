from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Folder, FileVersion, File, Repository, User
from pydantic import BaseModel
from .deps import get_current_user
from .utils import ensure_repository_access, ensure_folder_access, mark_file_deleted, mark_folder_deleted, mark_versions_deleted, safe_remove_file, safe_remove_tree, STORAGE_PATH


router = APIRouter()


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
             .filter(Repository.owner_id == current_user.id, Folder.is_deleted == False)\
             .all()


@router.get("/tree")
def get_folder_tree(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    root_folders = db.query(Folder)\
                     .join(Repository)\
                     .filter(Folder.parent_id.is_(None), Repository.owner_id == current_user.id, Folder.is_deleted == False)\
                     .all()

    return [folder.to_dict() for folder in root_folders]

@router.delete("/{folder_id}")
def delete_folder(folder_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    folder = ensure_folder_access(db, folder_id, current_user.id)

    delete_recursive(folder_id, db)

    db.commit()
    return {"message": "Folder deleted"}

def delete_recursive(folder_id: int, db: Session):
    """
    Рекурсивно удаляет папку и всё её содержимое
    """
    # Удаляем вложенные папки
    children = db.query(Folder).filter(Folder.parent_id == folder_id, Folder.is_deleted == False).all()

    for child in children:
        delete_recursive(child.id, db)
    
    # Удаляем файлы в папке
    files = db.query(File).filter(File.folder_id == folder_id, File.is_deleted == False).all()

    for file in files:
        # Удаляем версии с диска
        versions = db.query(FileVersion).filter(FileVersion.file_id == file.id, FileVersion.is_deleted == False).all()
        mark_versions_deleted(versions)
        for ver in versions:
            safe_remove_file(ver.file_path)

        file_dir = STORAGE_PATH / str(file.id)
        safe_remove_tree(file_dir)

        mark_file_deleted(file)

    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if folder:
        mark_folder_deleted(folder)
