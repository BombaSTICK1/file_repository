# backend/app/models.py
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    repositories = relationship("Repository", back_populates="owner")

class Repository(Base):
    __tablename__ = "repositories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    # ДОБАВЬ ЭТО:
    owner = relationship("User", back_populates="repositories")
    folders = relationship("Folder", back_populates="repository")  # ← КЛЮЧЕВАЯ СТРОКА

class Folder(Base):
    __tablename__ = "folders"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    parent_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"))
    path = Column(String, index=True)  # ← ДОБАВЬ ЭТУ СТРОКУ
    
    repository = relationship("Repository", back_populates="folders")
    children = relationship("Folder", back_populates="parent")
    parent = relationship("Folder", remote_side=[id], back_populates="children")
    files = relationship("File", back_populates="folder")

class File(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    path = Column(String, nullable=True)  # ← для относительного пути в архивах
    folder_id = Column(Integer, ForeignKey("folders.id"))
    repository_id = Column(Integer, ForeignKey("repositories.id"))
    
    folder = relationship("Folder", back_populates="files")
    versions = relationship("FileVersion", back_populates="file", order_by="FileVersion.version_number")

class FileVersion(Base):
    __tablename__ = "file_versions"
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"))
    version_number = Column(Integer, index=True)
    file_path = Column(String)
    commit_message = Column(String, nullable=True)  # Сообщение при обновлении
    
    file = relationship("File", back_populates="versions")