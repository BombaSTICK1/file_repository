from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from .database import Base
from typing import List

class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    parent_id = Column(Integer, ForeignKey("folders.id"), nullable=True)

    # Связи
    children = relationship("Folder", back_populates="parent")
    parent = relationship("Folder", remote_side=[id], back_populates="children")
    files = relationship("File", back_populates="folder")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "parent_id": self.parent_id,
            "children": [child.to_dict() for child in self.children],
            "files": [
                {
                    "id": f.id,
                    "name": f.name,
                    "version_count": len(f.versions)
                }
                for f in self.files
            ]
        }

class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    folder_id = Column(Integer, ForeignKey("folders.id"))

    folder = relationship("Folder", back_populates="files")
    versions = relationship("FileVersion", back_populates="file", order_by="FileVersion.version_number")

class FileVersion(Base):
    __tablename__ = "file_versions"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"))
    version_number = Column(Integer, index=True)
    file_path = Column(String)  # путь к файлу на диске
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    file = relationship("File", back_populates="versions")