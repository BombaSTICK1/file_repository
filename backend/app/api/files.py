# backend/app/api/files.py
import os
import shutil
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import File, FileVersion, Folder, Repository, User
from pydantic import BaseModel
from pathlib import Path
from fastapi.responses import FileResponse
import difflib
from .deps import get_current_user

router = APIRouter()

# Убедимся, что storage существует
STORAGE_PATH = Path("storage")
STORAGE_PATH.mkdir(exist_ok=True)

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
    # Проверяем, существует ли папка и принадлежит ли репозиторий пользователю
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Проверяем права доступа к репозиторию
    repo = db.query(Repository).filter(Repository.id == folder.repository_id, Repository.owner_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=403, detail="Access denied")

    # Создаём запись файла в БД
    db_file = File(name=file.filename, folder_id=folder_id)
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    # Создаём директорию для версий этого файла
    file_dir = STORAGE_PATH / str(db_file.id)
    file_dir.mkdir(exist_ok=True)

    # Путь к первой версии
    version_path = file_dir / "v1.bin"

    # Сохраняем файл на диск
    with open(version_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Создаём запись версии
    db_version = FileVersion(
        file_id=db_file.id,
        version_number=1,
        file_path=str(version_path)
    )
    db.add(db_version)
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
    # Находим существующий файл и проверяем права доступа
    db_file = db.query(File).filter(File.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Проверяем права доступа через репозиторий
    folder = db.query(Folder).filter(Folder.id == db_file.folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    repo = db.query(Repository).filter(Repository.id == folder.repository_id, Repository.owner_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=403, detail="Access denied")

    # Определяем номер новой версии
    last_version = db.query(FileVersion)\
                     .filter(FileVersion.file_id == file_id)\
                     .order_by(FileVersion.version_number.desc())\
                     .first()
    new_version_number = (last_version.version_number + 1) if last_version else 1

    # Путь к новой версии
    file_dir = STORAGE_PATH / str(file_id)
    file_dir.mkdir(exist_ok=True)
    version_path = file_dir / f"v{new_version_number}.bin"

    # Сохраняем файл
    with open(version_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Создаём запись версии с коммит-сообщением
    db_version = FileVersion(
        file_id=file_id,
        version_number=new_version_number,
        file_path=str(version_path),
        commit_message=commit_message if commit_message else None
    )
    db.add(db_version)
    db.commit()

    # Возвращаем данные файла
    version_count = db.query(FileVersion).filter(FileVersion.file_id == file_id).count()
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
             .filter(Repository.owner_id == current_user.id)\
             .all()
    result = []
    for f in files:
        version_count = db.query(FileVersion).filter(FileVersion.file_id == f.id).count()
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
    # Находим файл и проверяем права доступа
    db_file = db.query(File).filter(File.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Проверяем права доступа через репозиторий
    folder = db.query(Folder).filter(Folder.id == db_file.folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    repo = db.query(Repository).filter(Repository.id == folder.repository_id, Repository.owner_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=403, detail="Access denied")
    
    version = db.query(FileVersion)\
                .filter(FileVersion.file_id == file_id, FileVersion.version_number == version_number)\
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
    # Находим файл и проверяем права доступа
    db_file = db.query(File).filter(File.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Проверяем права доступа через репозиторий
    folder = db.query(Folder).filter(Folder.id == db_file.folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    repo = db.query(Repository).filter(Repository.id == folder.repository_id, Repository.owner_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=403, detail="Access denied")
    
    version = db.query(FileVersion)\
                .filter(FileVersion.file_id == file_id, FileVersion.version_number == version_number)\
                .first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    if not os.path.exists(version.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(path=version.file_path, filename=f"file_v{version_number}.bin")

@router.get("/{file_id}/versions")
def get_file_versions(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Находим файл и проверяем права доступа
    db_file = db.query(File).filter(File.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Проверяем права доступа через репозиторий
    folder = db.query(Folder).filter(Folder.id == db_file.folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    repo = db.query(Repository).filter(Repository.id == folder.repository_id, Repository.owner_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=403, detail="Access denied")
    
    versions = db.query(FileVersion)\
                 .filter(FileVersion.file_id == file_id)\
                 .order_by(FileVersion.version_number.desc())\
                 .all()
    return [
        {
            "id": v.id,
            "version_number": v.version_number,
            "commit_message": v.commit_message or f"Version {v.version_number}",
            "file_path": v.file_path
        }
        for v in versions
    ]

@router.get("/{file_id}/versions/{v1}/compare/{v2}")
def compare_versions(file_id: int, v1: int, v2: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Сравнить две версии файла
    v1 - старая версия, v2 - новая версия
    """
    # Находим файл и проверяем права доступа
    db_file = db.query(File).filter(File.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Проверяем права доступа через репозиторий
    folder = db.query(Folder).filter(Folder.id == db_file.folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    repo = db.query(Repository).filter(Repository.id == folder.repository_id, Repository.owner_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=403, detail="Access denied")
    
    version1 = db.query(FileVersion)\
                 .filter(FileVersion.file_id == file_id, FileVersion.version_number == v1)\
                 .first()
    version2 = db.query(FileVersion)\
                 .filter(FileVersion.file_id == file_id, FileVersion.version_number == v2)\
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
    # Находим файл и проверяем права доступа
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Проверяем права доступа через репозиторий
    folder = db.query(Folder).filter(Folder.id == file.folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    repo = db.query(Repository).filter(Repository.id == folder.repository_id, Repository.owner_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Удаляем все версии с диска
    versions = db.query(FileVersion).filter(FileVersion.file_id == file_id).all()
    for ver in versions:
        if os.path.exists(ver.file_path):
            os.remove(ver.file_path)
        db.delete(ver)
    
    # Удаляем папку файла
    file_dir = STORAGE_PATH / str(file_id)
    if file_dir.exists():
        shutil.rmtree(file_dir)  # ← УДАЛЯЕТ ВСЮ ПАПКУ
    
    db.delete(file)
    db.commit()
    return {"message": "File and storage deleted"}