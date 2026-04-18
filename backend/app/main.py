from fastapi import FastAPI
from app.database import engine, Base
from app.api import folders, files, repositories, auth
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

# Создаём таблицы (только если их нет)
Base.metadata.create_all(bind=engine)

# Определяем режим работы
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")  # development или production
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Настраиваем CORS в зависимости от режима
if ENVIRONMENT == "production":
    allow_origins = [FRONTEND_URL]
else:
    # Для разработки разрешаем localhost
    allow_origins = [
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ]

app = FastAPI(
    title="File Repository API",
    redirect_slashes=False,
    debug=(ENVIRONMENT == "development")
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
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