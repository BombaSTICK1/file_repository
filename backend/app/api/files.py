# backend/app/api/files.py
import os
import shutil
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import File, FileVersion, Folder
from pydantic import BaseModel
from pathlib import Path
from fastapi.responses import FileResponse

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
    db: Session = Depends(get_db)
):
    # Проверяем, существует ли папка
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

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
    db: Session = Depends(get_db)
):
    # Находим существующий файл
    db_file = db.query(File).filter(File.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

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

    # Создаём запись версии
    db_version = FileVersion(
        file_id=file_id,
        version_number=new_version_number,
        file_path=str(version_path)
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
def get_files(db: Session = Depends(get_db)):
    files = db.query(File).all()
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

@router.get("/{file_id}/versions/{version_number}")
def download_file_version(file_id: int, version_number: int, db: Session = Depends(get_db)):
    version = db.query(FileVersion)\
                .filter(FileVersion.file_id == file_id, FileVersion.version_number == version_number)\
                .first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    if not os.path.exists(version.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(path=version.file_path, filename=f"file_v{version_number}.bin")

@router.get("/{file_id}/versions")
def get_file_versions(file_id: int, db: Session = Depends(get_db)):
    versions = db.query(FileVersion)\
                 .filter(FileVersion.file_id == file_id)\
                 .order_by(FileVersion.version_number)\
                 .all()
    return [
        {
            "id": v.id,
            "version_number": v.version_number,
            "created_at": v.created_at.isoformat() if v.created_at else None
        }
        for v in versions
    ]

@router.delete("/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db)):
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
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