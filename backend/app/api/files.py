# backend/app/api/files.py
import os
import shutil
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import File, FileVersion, Folder, Repository, User
from pydantic import BaseModel
from fastapi.responses import FileResponse
import difflib
from .deps import get_current_user
from .utils import ensure_file_access, ensure_folder_access, get_or_create_next_version, mark_file_deleted, mark_versions_deleted, safe_remove_file, safe_remove_tree, STORAGE_PATH, validate_upload_size


router = APIRouter()


class FileOut(BaseModel):
    id: int
    name: str
    folder_id: int
    version_count: int

    class Config:
        from_attributes = True

@router.post("/", response_model=FileOut)
async def upload_file(
    folder_id: int = Form(),
    file: UploadFile = File(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    validate_upload_size(file.size)
    folder = ensure_folder_access(db, folder_id, current_user.id)

    existing_file = db.query(File).filter(
        File.name == file.filename,
        File.folder_id == folder_id,
        File.is_deleted == False
    ).first()

    if existing_file:
        get_or_create_next_version(db, existing_file.id, file.file)
        db.commit()

        version_count = db.query(FileVersion).filter(FileVersion.file_id == existing_file.id, FileVersion.is_deleted == False).count()
        return {
            "id": existing_file.id,
            "name": existing_file.name,
            "folder_id": existing_file.folder_id,
            "version_count": version_count
        }

    db_file = File(name=file.filename, folder_id=folder_id, repository_id=folder.repository_id)

    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    get_or_create_next_version(db, db_file.id, file.file)
    db.commit()


    return {
        "id": db_file.id,
        "name": db_file.name,
        "folder_id": db_file.folder_id,
        "version_count": 1
    }

@router.post("/{file_id}/upload-version", response_model=FileOut)
async def upload_new_version(
    file_id: int,
    file: UploadFile = File(),
    commit_message: str = Form(default=""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    validate_upload_size(file.size)
    db_file, _, _ = ensure_file_access(db, file_id, current_user.id)

    get_or_create_next_version(db, file_id, file.file, commit_message)
    db.commit()


    # Возвращаем данные файла
    version_count = db.query(FileVersion).filter(FileVersion.file_id == file_id, FileVersion.is_deleted == False).count()

    return {
        "id": db_file.id,
        "name": db_file.name,
        "folder_id": db_file.folder_id,
        "version_count": version_count
    }

@router.get("/", response_model=list[FileOut])
def get_files(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Получаем все файлы из репозиториев пользователя
    files = db.query(File)\
             .join(Folder)\
             .join(Repository)\
             .filter(Repository.owner_id == current_user.id, File.is_deleted == False, Folder.is_deleted == False)\
             .all()

    result = []
    for f in files:
        version_count = db.query(FileVersion).filter(FileVersion.file_id == f.id, FileVersion.is_deleted == False).count()

        result.append({
            "id": f.id,
            "name": f.name,
            "folder_id": f.folder_id,
            "version_count": version_count
        })
    return result

@router.get("/{file_id}/versions/{version_number}/content")
def get_file_content(file_id: int, version_number: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Получить содержимое файла определённой версии
    """
    ensure_file_access(db, file_id, current_user.id)

    version = db.query(FileVersion)\
                .filter(FileVersion.file_id == file_id, FileVersion.version_number == version_number, FileVersion.is_deleted == False)\
                .first()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    file_path = version.file_path
    # Если путь относительный, преобразуем его в абсолютный
    if not os.path.isabs(file_path):
        file_path = os.path.join(os.getcwd(), file_path)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found on disk: {file_path}")

    try:
        # Читаем файл как бинарный и декодируем
        with open(file_path, 'rb') as f:
            content_bytes = f.read()
        
        # Пытаемся декодировать как UTF-8
        content = content_bytes.decode('utf-8')
        return {"content": content, "file_id": file_id, "version_number": version_number}
    except UnicodeDecodeError:
        # Если файл не текстовый, возвращаем сообщение об ошибке
        return {"content": "[Файл не является текстовым файлом]", "file_id": file_id, "version_number": version_number, "is_binary": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")

@router.get("/{file_id}/versions/{version_number}")
def download_file_version(file_id: int, version_number: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_file_access(db, file_id, current_user.id)

    version = db.query(FileVersion)\
                .filter(FileVersion.file_id == file_id, FileVersion.version_number == version_number, FileVersion.is_deleted == False)\
                .first()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    if not os.path.exists(version.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(path=version.file_path, filename=f"file_v{version_number}.bin")

@router.get("/{file_id}/versions")
def get_file_versions(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_file_access(db, file_id, current_user.id)

    versions = db.query(FileVersion)\
                 .filter(FileVersion.file_id == file_id, FileVersion.is_deleted == False)\
                 .order_by(FileVersion.version_number.desc())\
                 .all()

    return [
        {
            "id": v.id,
            "version_number": v.version_number,
            "commit_message": v.commit_message or f"Version {v.version_number}",
            "file_path": v.file_path,
            "size_bytes": v.size_bytes

        }
        for v in versions
    ]

@router.get("/{file_id}/versions/{v1}/compare/{v2}")
def compare_versions(file_id: int, v1: int, v2: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Сравнить две версии файла
    v1 - старая версия, v2 - новая версия
    """
    ensure_file_access(db, file_id, current_user.id)

    version1 = db.query(FileVersion)\
                 .filter(FileVersion.file_id == file_id, FileVersion.version_number == v1, FileVersion.is_deleted == False)\
                 .first()
    version2 = db.query(FileVersion)\
                 .filter(FileVersion.file_id == file_id, FileVersion.version_number == v2, FileVersion.is_deleted == False)\
                 .first()
    
    if not version1 or not version2:
        raise HTTPException(status_code=404, detail="Version not found")
    
    
    # Читаем обе версии
    def read_file(file_path):
        if not os.path.isabs(file_path):
            file_path = os.path.join(os.getcwd(), file_path)
        
        try:
            with open(file_path, 'rb') as f:
                return f.read().decode('utf-8').splitlines(keepends=True)
        except (UnicodeDecodeError, FileNotFoundError):
            return ["[Не удаётся прочитать файл]\n"]
    
    content1 = read_file(version1.file_path)
    content2 = read_file(version2.file_path)
    
    # Создаём diff
    diff = list(difflib.unified_diff(
        content1, 
        content2,
        fromfile=f"v{v1}",
        tofile=f"v{v2}",
        lineterm=""
    ))
    
    return {
        "file_id": file_id,
        "version_from": v1,
        "version_to": v2,
        "diff": diff
    }

@router.delete("/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    file, _, _ = ensure_file_access(db, file_id, current_user.id)

    versions = db.query(FileVersion).filter(FileVersion.file_id == file_id, FileVersion.is_deleted == False).all()
    mark_versions_deleted(versions)
    for ver in versions:
        safe_remove_file(ver.file_path)

    file_dir = STORAGE_PATH / str(file_id)
    safe_remove_tree(file_dir)

    mark_file_deleted(file)
    db.commit()
    return {"message": "File deleted"}
