from __future__ import annotations

import os
import shutil
from pathlib import Path
from typing import Iterable

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import File, FileVersion, Folder, Repository, User

STORAGE_PATH = Path("storage")
STORAGE_PATH.mkdir(exist_ok=True)


def ensure_repository_access(db: Session, repo_id: int, user_id: int) -> Repository:
    repo = db.query(Repository).filter(Repository.id == repo_id, Repository.owner_id == user_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found or access denied")
    return repo


def ensure_folder_access(db: Session, folder_id: int, user_id: int) -> Folder:
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.is_deleted == False).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    ensure_repository_access(db, folder.repository_id, user_id)
    return folder


def ensure_file_access(db: Session, file_id: int, user_id: int) -> tuple[File, Folder, Repository]:
    db_file = db.query(File).filter(File.id == file_id, File.is_deleted == False).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    folder = db.query(Folder).filter(Folder.id == db_file.folder_id, Folder.is_deleted == False).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    repo = ensure_repository_access(db, folder.repository_id, user_id)
    return db_file, folder, repo


def get_or_create_next_version(db: Session, file_id: int, file_obj, commit_message: str | None = None) -> int:
    last_version = (
        db.query(FileVersion)
        .filter(FileVersion.file_id == file_id, FileVersion.is_deleted == False)
        .order_by(FileVersion.version_number.desc())
        .first()
    )
    new_version_number = (last_version.version_number + 1) if last_version else 1

    file_dir = STORAGE_PATH / str(file_id)
    file_dir.mkdir(parents=True, exist_ok=True)
    version_path = file_dir / f"v{new_version_number}.bin"

    with open(version_path, "wb") as buffer:
        shutil.copyfileobj(file_obj, buffer)

    db_version = FileVersion(
        file_id=file_id,
        version_number=new_version_number,
        file_path=str(version_path),
        commit_message=commit_message or None,
        size_bytes=version_path.stat().st_size,
    )
    db.add(db_version)
    return new_version_number


def safe_remove_file(path_str: str) -> None:
    if not path_str:
        return

    path = Path(path_str)
    if not path.is_absolute():
        path = Path(os.getcwd()) / path

    if path.exists() and path.is_file():
        path.unlink()


def safe_remove_tree(path: Path) -> None:
    if path.exists() and path.is_dir():
        shutil.rmtree(path)


def mark_versions_deleted(versions: Iterable[FileVersion]) -> None:
    for version in versions:
        version.is_deleted = True


def mark_file_deleted(db_file: File) -> None:
    db_file.is_deleted = True


def mark_folder_deleted(folder: Folder) -> None:
    folder.is_deleted = True


def validate_upload_size(upload_size: int | None, max_size_bytes: int = 50 * 1024 * 1024) -> None:
    if upload_size is not None and upload_size > max_size_bytes:
        raise HTTPException(status_code=413, detail="File is too large")


def validate_relative_path(relative_path: str) -> None:
    normalized = relative_path.replace('\\', '/').strip('/')
    parts = [part for part in normalized.split('/') if part]
    if not parts or any(part in {'.', '..'} for part in parts):
        raise HTTPException(status_code=400, detail="Invalid relative path")
