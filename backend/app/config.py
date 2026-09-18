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
