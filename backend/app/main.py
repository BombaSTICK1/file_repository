from fastapi import FastAPI
from app.database import engine, Base
from app.api import folders, files
from fastapi.middleware.cors import CORSMiddleware

# Создаём таблицы (только если их нет)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="File Repository API",
    redirect_slashes=False  
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # ← Vite по умолчанию
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(folders.router, prefix="/api/folders", tags=["folders"])
app.include_router(files.router, prefix="/api/files", tags=["files"])

@app.get("/")
def read_root():
    return {"message": "File Repository API"}