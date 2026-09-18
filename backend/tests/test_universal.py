import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import BASE_DIR
from app.parser.universal_parser import universal_parser, detect_language_and_framework
from app.mapping.universal_mapper import universal_mapper

def test_detect_language_express():
    express_dir = BASE_DIR / "samples" / "express-bookstore"
    lang, fw = detect_language_and_framework(express_dir)
    assert lang == "javascript"
    assert fw == "express"

def test_detect_language_flask():
    flask_dir = BASE_DIR / "samples" / "python-taskapi"
    lang, fw = detect_language_and_framework(flask_dir)
    assert lang == "python"
    assert fw == "flask"

def test_universal_parse_flask():
    flask_dir = BASE_DIR / "samples" / "python-taskapi"
    u_proj = universal_parser.parse_project(flask_dir, "Task API")
    assert u_proj.source_language == "python"
    assert u_proj.source_framework == "flask"
    assert len(u_proj.routes) >= 4
    assert len(u_proj.models) >= 1
    assert u_proj.models[0].name == "Task"

def test_universal_generate_spring_from_flask():
    flask_dir = BASE_DIR / "samples" / "python-taskapi"
    u_proj = universal_parser.parse_project(flask_dir, "Task API")
    target_key, files = universal_mapper.generate_project(u_proj, "spring_boot")
    assert target_key == "spring_boot"
    paths = [p for p, _ in files]
    assert "pom.xml" in paths
    assert any("Task.java" in p for p in paths)
    assert any("TaskController.java" in p for p in paths)

def test_universal_generate_fastapi_from_express():
    express_dir = BASE_DIR / "samples" / "express-bookstore"
    u_proj = universal_parser.parse_project(express_dir, "Bookstore API")
    target_key, files = universal_mapper.generate_project(u_proj, "fastapi")
    assert target_key == "fastapi"
    paths = [p for p, _ in files]
    assert "main.py" in paths
    assert "requirements.txt" in paths
    assert "routes.py" in paths

def test_universal_generate_gin_from_flask():
    flask_dir = BASE_DIR / "samples" / "python-taskapi"
    u_proj = universal_parser.parse_project(flask_dir, "Task API")
    target_key, files = universal_mapper.generate_project(u_proj, "gin")
    assert target_key == "gin"
    paths = [p for p, _ in files]
    assert "go.mod" in paths
    assert "main.go" in paths
    assert "routes.go" in paths

def test_universal_generate_express_from_flask():
    flask_dir = BASE_DIR / "samples" / "python-taskapi"
    u_proj = universal_parser.parse_project(flask_dir, "Task API")
    target_key, files = universal_mapper.generate_project(u_proj, "express")
    assert target_key == "express"
    paths = [p for p, _ in files]
    assert "package.json" in paths
    assert "server.js" in paths
    assert "routes/api.js" in paths
