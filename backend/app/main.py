from fastapi import FastAPI
from app.database import engine, Base
from app.api import folders, files, repositories, auth
from fastapi.middleware.cors import CORSMiddleware

# Создаём таблицы (только если их нет)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="File Repository API",
    redirect_slashes=False  
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(repositories.router, prefix="/api/repos", tags=["repos"])
app.include_router(folders.router, prefix="/api/folders", tags=["folders"])
app.include_router(files.router, prefix="/api/files", tags=["files"])

@app.get("/")
def read_root():
    return {"message": "File Repository API"}