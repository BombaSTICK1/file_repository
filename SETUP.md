# File Repository Project Setup Guide

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r app/requirements.txt
```

3. Create .env file (copy from .env.example):
```bash
cp .env .env
```

4. Run the FastAPI server:
```bash
uvicorn app.main:app --reload
```

The backend will be available at: http://127.0.0.1:8000

### Backend API Documentation
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node dependencies:
```bash
npm install
```

3. Create .env.local file:
```bash
VITE_API_URL=http://127.0.0.1:8000/api
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at: http://127.0.0.1:5173

## Project Features

- **User Authentication**: Register and login functionality
- **Repository Management**: Create and manage file repositories
- **Folder Structure**: Organize files in nested folders
- **File Versioning**: Track file versions with version history
- **File Upload**: Upload individual files or entire folder structures
- **ZIP Archive Support**: Upload project structure from ZIP archives

## Database

The project uses SQLite by default. The database file is created automatically at:
- Backend: `backend/file_repo.db`

## Security Notes

⚠️ **Important for Production**:
- Change the `SECRET_KEY` in `backend/app/security.py`
- Update `allow_origins` in `backend/app/main.py` for CORS
- Use environment variables for sensitive data
- Configure proper database (PostgreSQL recommended)
- Enable HTTPS/SSL
