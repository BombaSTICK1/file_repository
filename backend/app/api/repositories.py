# backend/app/api/repositories.py
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Repository, Folder, File, FileVersion, User
from pydantic import BaseModel
import shutil
import zipfile
from pathlib import Path
import os
from .folders import delete_recursive
from .deps import get_current_user

router = APIRouter()

# Путь к хранилищу файлов
STORAGE_PATH = Path("storage")
STORAGE_PATH.mkdir(exist_ok=True)

# Схемы Pydantic
class RepositoryCreate(BaseModel):
    name: str

class RepositoryOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

# Метод для рекурсивного преобразования папки в словарь
def folder_to_dict(folder):
    return {
        "id": folder.id,
        "name": folder.name,
        "parent_id": folder.parent_id,
        "children": [folder_to_dict(child) for child in folder.children],
        "files": [
            {
                "id": f.id,
                "name": f.name,
                "version_count": len(f.versions)
            }
            for f in folder.files
        ]
    }

# 1. Создать репозиторий
@router.post("/", response_model=RepositoryOut)
def create_repository(
    repo: RepositoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_repo = Repository(name=repo.name, owner_id=current_user.id)
    db.add(db_repo)
    db.commit()
    db.refresh(db_repo)
   
    # Создаём корневую папку
    root_folder = Folder(
        name=repo.name,
        repository_id=db_repo.id,
        
    )
    db.add(root_folder)
    db.commit()
    db.refresh(root_folder)
    
    return db_repo

# 2. Получить список репозиториев
@router.get("/", response_model=list[RepositoryOut])
def get_repositories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Repository).filter(Repository.owner_id == current_user.id).all()

# 3. Получить дерево репозитория
@router.get("/{repo_id}/tree")
def get_repository_tree(repo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Проверяем существование репозитория и права доступа
    repo = db.query(Repository).filter(Repository.id == repo_id, Repository.owner_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found or access denied")
    
    # Получаем корневые папки репозитория
    root_folders = db.query(Folder)\
                     .filter(Folder.repository_id == repo_id, Folder.parent_id.is_(None))\
                     .all()
    
    return [folder_to_dict(f) for f in root_folders]

# 4. Загрузить ZIP-архив в репозиторий
@router.post("/{repo_id}/upload-zip")
async def upload_repo_zip(
    repo_id: int,
    file: UploadFile = File(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Проверяем существование репозитория и права доступа
    repo = db.query(Repository).filter(Repository.id == repo_id, Repository.owner_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found or access denied")
    
    # Проверяем расширение файла
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Only ZIP files are allowed")
    
    # Сохраняем ZIP во временную папку
    zip_path = STORAGE_PATH / f"temp_{repo_id}_{file.filename}"
    with open(zip_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Папка для распаковки
    extract_path = STORAGE_PATH / f"extract_{repo_id}"
    extract_path.mkdir(exist_ok=True)
    
    try:
        # Распаковываем архив
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
        
        def create_structure(path: Path, repo_id: int, base_path: Path, db: Session):
            """
            Рекурсивно обрабатывает распакованную директорию
            """
            # Получаем все элементы в текущей директории
            items = list(path.iterdir())
            
            for item in items:
                if item.is_dir():
                    # Вычисляем относительный путь от корня распаковки
                    rel_path = item.relative_to(base_path)
                    folder_path_str = str(rel_path).replace("\\", "/")
                    
                    # Проверяем существование папки
                    existing_folder = db.query(Folder).filter(
                        Folder.repository_id == repo_id,
                        Folder.path == folder_path_str
                    ).first()
                    
                    if not existing_folder:
                        # Находим родительскую папку
                        parent_folder_id = None
                        if str(rel_path.parent) != ".":
                            parent_path = str(rel_path.parent).replace("\\", "/")
                            parent_folder = db.query(Folder).filter(
                                Folder.repository_id == repo_id,
                                Folder.path == parent_path
                            ).first()
                            if parent_folder:
                                parent_folder_id = parent_folder.id
                        
                        # Создаём новую папку
                        db_folder = Folder(
                            name=item.name,
                            parent_id=parent_folder_id,
                            repository_id=repo_id,
                            path=folder_path_str
                        )
                        db.add(db_folder)
                        db.flush()
                        db.refresh(db_folder)
                    else:
                        db_folder = existing_folder
                    
                    # Рекурсивно обрабатываем содержимое
                    create_structure(item, repo_id, base_path, db)
                    
                else:
                    # Обработка файла
                    rel_path = item.relative_to(base_path)
                    file_path_str = str(rel_path).replace("\\", "/")
                    
                    # Ищем существующий файл
                    existing_file = db.query(File).filter(
                        File.repository_id == repo_id,
                        File.path == file_path_str
                    ).first()
                    
                    if existing_file:
                        # Новая версия
                        last_version = db.query(FileVersion)\
                            .filter(FileVersion.file_id == existing_file.id)\
                            .order_by(FileVersion.version_number.desc())\
                            .first()
                        new_version_number = (last_version.version_number + 1) if last_version else 1
                        
                        file_dir = STORAGE_PATH / str(existing_file.id)
                        file_dir.mkdir(parents=True, exist_ok=True)
                        version_path = file_dir / f"v{new_version_number}.bin"
                        shutil.copy2(item, version_path)
                        
                        db_version = FileVersion(
                            file_id=existing_file.id,
                            version_number=new_version_number,
                            file_path=str(version_path)
                        )
                        db.add(db_version)
                        
                    else:
                        # Новый файл
                        parent_folder_id = None
                        if str(rel_path.parent) != ".":
                            parent_path = str(rel_path.parent).replace("\\", "/")
                            parent_folder = db.query(Folder).filter(
                                Folder.repository_id == repo_id,
                                Folder.path == parent_path
                            ).first()
                            if parent_folder:
                                parent_folder_id = parent_folder.id
                        
                        db_file = File(
                            name=item.name,
                            path=file_path_str,
                            folder_id=parent_folder_id,
                            repository_id=repo_id
                        )
                        db.add(db_file)
                        db.flush()
                        db.refresh(db_file)
                        
                        file_dir = STORAGE_PATH / str(db_file.id)
                        file_dir.mkdir(parents=True, exist_ok=True)
                        version_path = file_dir / "v1.bin"
                        shutil.copy2(item, version_path)
                        
                        db_version = FileVersion(
                            file_id=db_file.id,
                            version_number=1,
                            file_path=str(version_path)
                        )
                        db.add(db_version)
        
        # Внутри try блока после распаковки:
        create_structure(extract_path, repo_id, extract_path, db)
        db.commit()
        
        return {"message": "Repository structure uploaded successfully"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing ZIP: {str(e)}")
    
    finally:
        # Удаляем временные файлы
        if zip_path.exists():
            zip_path.unlink()
        if extract_path.exists():
            shutil.rmtree(extract_path)

@router.delete("/{repo_id}")
def delete_repository(repo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = db.query(Repository).filter(Repository.id == repo_id, Repository.owner_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found or access denied")
    
    # Получаем все папки репозитория
    folders = db.query(Folder).filter(Folder.repository_id == repo_id).all()
    for folder in folders:
        delete_recursive(folder.id, db)  # ← Используем ту же функцию
    
    db.delete(repo)
    db.commit()
    return {"message": "Repository deleted"}

@router.post("/{repo_id}/upload-file")
async def upload_single_file(
    repo_id: int,
    folder_id: int = Form(),
    file: UploadFile = File(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Проверяем существование репозитория и права доступа
    repo = db.query(Repository).filter(Repository.id == repo_id, Repository.owner_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found or access denied")
    
    # Проверяем существование папки
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.repository_id == repo_id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Ищем существующий файл с таким именем в этой папке
    existing_file = db.query(File).filter(
        File.name == file.filename,
        File.folder_id == folder_id
    ).first()
    
    if existing_file:
        # Создаём новую версию существующего файла
        last_version = db.query(FileVersion)\
            .filter(FileVersion.file_id == existing_file.id)\
            .order_by(FileVersion.version_number.desc())\
            .first()
        new_version_number = (last_version.version_number + 1) if last_version else 1
        
        # Сохраняем файл на диск
        file_dir = STORAGE_PATH / str(existing_file.id)
        file_dir.mkdir(parents=True, exist_ok=True)
        version_path = file_dir / f"v{new_version_number}.bin"
        
        with open(version_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Создаём запись версии
        db_version = FileVersion(
            file_id=existing_file.id,
            version_number=new_version_number,
            file_path=str(version_path)
        )
        db.add(db_version)
        db.commit()
        
        return {"message": "New version created", "version": new_version_number}
    
    else:
        # Создаём новый файл
        db_file = File(
            name=file.filename,
            folder_id=folder_id,
            repository_id=repo_id  # ← КЛЮЧЕВОЕ ДОБАВЛЕНИЕ
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        # Сохраняем первую версию
        file_dir = STORAGE_PATH / str(db_file.id)
        file_dir.mkdir(parents=True, exist_ok=True)
        version_path = file_dir / "v1.bin"
        
        with open(version_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        db_version = FileVersion(
            file_id=db_file.id,
            version_number=1,
            file_path=str(version_path)
        )
        db.add(db_version)
        db.commit()
        
        return {"message": "New file created"}

@router.post("/{repo_id}/upload-file-with-path")
async def upload_file_with_path(
    repo_id: int,
    folder_id: int = Form(),
    relative_path: str = Form(),  # Относительный путь внутри загружаемой папки
    file: UploadFile = File(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Проверяем существование репозитория и права доступа
    repo = db.query(Repository).filter(Repository.id == repo_id, Repository.owner_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found or access denied")
    
    # Проверяем папку
    base_folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.repository_id == repo_id
    ).first()
    if not base_folder:
        raise HTTPException(status_code=404, detail="Base folder not found")
    
    # Разбиваем путь на компоненты
    path_parts = [p for p in relative_path.split("/") if p]
    if not path_parts:
        raise HTTPException(status_code=400, detail="Invalid path")
    
    # Создаём вложенные папки
    current_parent_id = folder_id
    current_base_path = base_folder.path or ""
    
    for i, part in enumerate(path_parts[:-1]):  # Все кроме последнего (файла)
        # Формируем путь для текущей папки
        if current_base_path:
            folder_path = f"{current_base_path}/{part}"
        else:
            folder_path = part
        
        # Ищем существующую папку
        existing_folder = db.query(Folder).filter(
            Folder.repository_id == repo_id,
            Folder.path == folder_path
        ).first()
        
        if existing_folder:
            current_parent_id = existing_folder.id
        else:
            # Создаём новую папку
            new_folder = Folder(
                name=part,
                parent_id=current_parent_id,
                repository_id=repo_id,
                path=folder_path
            )
            db.add(new_folder)
            db.flush()
            db.refresh(new_folder)
            current_parent_id = new_folder.id
    
    # Обрабатываем файл
    file_name = path_parts[-1]
    full_path = f"{current_base_path}/{relative_path}" if current_base_path else relative_path
    
    # Ищем существующий файл
    existing_file = db.query(File).filter(
        File.name == file_name,
        File.folder_id == current_parent_id
    ).first()
    
    if existing_file:
        # Новая версия
        last_version = db.query(FileVersion)\
            .filter(FileVersion.file_id == existing_file.id)\
            .order_by(FileVersion.version_number.desc())\
            .first()
        new_version = (last_version.version_number + 1) if last_version else 1
        
        file_dir = STORAGE_PATH / str(existing_file.id)
        file_dir.mkdir(parents=True, exist_ok=True)
        version_path = file_dir / f"v{new_version}.bin"
        
        with open(version_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        db_version = FileVersion(
            file_id=existing_file.id,
            version_number=new_version,
            file_path=str(version_path)
        )
        db.add(db_version)
    else:
        # Новый файл
        new_file = File(
            name=file_name,
            folder_id=current_parent_id,
            repository_id=repo_id
        )
        db.add(new_file)
        db.flush()
        db.refresh(new_file)
        
        file_dir = STORAGE_PATH / str(new_file.id)
        file_dir.mkdir(parents=True, exist_ok=True)
        version_path = file_dir / "v1.bin"
        
        with open(version_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        db_version = FileVersion(
            file_id=new_file.id,
            version_number=1,
            file_path=str(version_path)
        )
        db.add(db_version)
    
    db.commit()
    return {"message": "File processed"}