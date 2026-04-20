from fastapi import FastAPI
from sqlalchemy import text
from app.database import engine, Base
from app.api import folders, files, repositories, auth
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv


# Загружаем переменные окружения
load_dotenv()

# Создаём таблицы (только если их нет)
Base.metadata.create_all(bind=engine)


def apply_lightweight_migrations():
    """
    Применяет простые миграции для SQLite и PostgreSQL
    """
    with engine.begin() as connection:
        if engine.dialect.name == "sqlite":
            folder_columns = {row[1] for row in connection.execute(text("PRAGMA table_info(folders)"))}
            if "is_deleted" not in folder_columns:
                connection.execute(text("ALTER TABLE folders ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT 0"))

            file_columns = {row[1] for row in connection.execute(text("PRAGMA table_info(files)"))}
            if "is_deleted" not in file_columns:
                connection.execute(text("ALTER TABLE files ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT 0"))

            version_columns = {row[1] for row in connection.execute(text("PRAGMA table_info(file_versions)"))}
            if "is_deleted" not in version_columns:
                connection.execute(text("ALTER TABLE file_versions ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT 0"))
            if "size_bytes" not in version_columns:
                connection.execute(text("ALTER TABLE file_versions ADD COLUMN size_bytes INTEGER"))
        
        elif engine.dialect.name == "postgresql":
            # Для PostgreSQL проверяем через INFORMATION_SCHEMA
            tables_to_check = [
                ("folders", "is_deleted"),
                ("files", "is_deleted"),
                ("file_versions", "is_deleted"),
                ("file_versions", "size_bytes"),
            ]
            
            for table, column in tables_to_check:
                result = connection.execute(
                    text(f"""
                        SELECT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = :table AND column_name = :column
                        )
                    """),
                    {"table": table, "column": column}
                ).scalar()
                
                if not result:
                    if column == "is_deleted":
                        connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} BOOLEAN NOT NULL DEFAULT FALSE"))
                    elif column == "size_bytes":
                        connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} INTEGER"))


apply_lightweight_migrations()



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