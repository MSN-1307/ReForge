import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_DIR = BASE_DIR
STORAGE_DIR = WORKSPACE_DIR / "backend" / "data"
PROJECTS_DIR = STORAGE_DIR / "projects"
TARGETS_DIR = STORAGE_DIR / "targets"
DB_PATH = STORAGE_DIR / "reforge.db"

STORAGE_DIR.mkdir(parents=True, exist_ok=True)
PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
TARGETS_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    app_name: str = "ReForge - Autonomous Software Migration & Modernization"
    version: str = "1.0.0"
    debug: bool = True
    llm_provider: str = os.getenv("REFORGE_LLM_PROVIDER", "mock")  # mock, ollama, gemini, groq
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "qwen2.5-coder")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")

settings = Settings()

SUPPORTED_LANGUAGES = [
    {"id": "javascript", "name": "JavaScript", "frameworks": ["Express.js", "Koa"], "icon": "js"},
    {"id": "typescript", "name": "TypeScript", "frameworks": ["NestJS", "Express"], "icon": "ts"},
    {"id": "python", "name": "Python", "frameworks": ["FastAPI", "Flask", "Django REST"], "icon": "python"},
    {"id": "java", "name": "Java", "frameworks": ["Spring Boot 3", "Jakarta EE"], "icon": "java"},
    {"id": "go", "name": "Go", "frameworks": ["Gin", "Echo"], "icon": "go"},
    {"id": "php", "name": "PHP", "frameworks": ["Laravel", "Symfony"], "icon": "php"},
    {"id": "ruby", "name": "Ruby", "frameworks": ["Rails", "Sinatra"], "icon": "ruby"},
]

MIGRATION_TARGETS = [
    {"id": "spring_boot", "name": "Java Spring Boot 3", "language": "Java", "badge": "Enterprise Ready", "desc": "Full MVC with JPA Entities, Repositories, and Maven build"},
    {"id": "fastapi", "name": "Python FastAPI", "language": "Python", "badge": "High Performance", "desc": "Async routes, Pydantic v2 validation, SQLAlchemy ORM"},
    {"id": "flask", "name": "Python Flask", "language": "Python", "badge": "Lightweight", "desc": "Blueprints, SQLAlchemy models, Flask-CORS"},
    {"id": "gin", "name": "Go Gin", "language": "Go", "badge": "Ultra Fast", "desc": "High-throughput compiled binary with GORM"},
    {"id": "express", "name": "Node.js Express", "language": "JavaScript", "badge": "Universal JS", "desc": "Clean Express 4 REST routing and CORS middleware"},
]
