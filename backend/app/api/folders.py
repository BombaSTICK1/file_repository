from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Folder
from pydantic import BaseModel

router = APIRouter()

class FolderCreate(BaseModel):
    name: str
    parent_id: int | None = None

class FolderResponse(BaseModel):
    id: int
    name: str
    parent_id: int | None

    class Config:
        from_attributes = True  # Pydantic v2 (ранее orm_mode = True)

@router.post("/", response_model=FolderResponse)
def create_folder(folder: FolderCreate, db: Session = Depends(get_db)):
    db_folder = Folder(name=folder.name, parent_id=folder.parent_id)
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

@router.get("/", response_model=list[FolderResponse])
def get_folders(db: Session = Depends(get_db)):
    return db.query(Folder).all()

@router.get("/tree")
def get_folder_tree(db: Session = Depends(get_db)):
    root_folders = db.query(Folder).filter(Folder.parent_id.is_(None)).all()
    return [folder.to_dict() for folder in root_folders]