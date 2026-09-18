from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from pathlib import Path
import shutil
import zipfile
import uuid
from typing import List, Dict, Any, Optional
from app.config import PROJECTS_DIR, BASE_DIR, MIGRATION_TARGETS, SUPPORTED_LANGUAGES
from app.storage.db import (
    save_project, list_projects, get_project, get_agent_events, record_agent_event
)
from app.mcp.tools.analysis import build_dependency_graph, analyze_repository
from app.parser.universal_parser import detect_language_and_framework
from app.api.ws import ws_manager

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("/targets")
def get_migration_targets():
    """Returns supported source languages and target frameworks for migration."""
    return {
        "source_languages": SUPPORTED_LANGUAGES,
        "target_frameworks": MIGRATION_TARGETS
    }

@router.get("")
def get_all_projects():
    return {"projects": list_projects()}

@router.get("/{project_id}")
def get_single_project(project_id: str):
    p = get_project(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p

@router.get("/{project_id}/events")
def get_project_events(project_id: str):
    events = get_agent_events(project_id, limit=200)
    return {"events": events}

@router.get("/{project_id}/graph")
def get_project_graph(project_id: str):
    p = get_project(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    graph_data = build_dependency_graph(project_id)
    return graph_data

@router.post("/sample")
async def load_sample_project(background_tasks: BackgroundTasks):
    """
    Loads the bundled Express Bookstore sample repository into a new active project.
    Allows zero-friction, 1-click testing of the entire ReForge platform.
    """
    sample_source = BASE_DIR / "samples" / "express-bookstore"
    if not sample_source.exists():
        raise HTTPException(status_code=404, detail="Bundled sample project not found on server.")

    project_id = f"proj-{uuid.uuid4().hex[:8]}"
    project_dest = PROJECTS_DIR / project_id
    shutil.copytree(sample_source, project_dest)

    save_project(
        project_id=project_id,
        name="Express Bookstore API",
        source_framework="Node.js / Express",
        target_framework="Spring Boot / Java",
        source_path=str(project_dest),
        status="INITIALIZED"
    )

    record_agent_event(
        project_id=project_id,
        category="EVIDENCE",
        agent_name="ArchaeologistAgent",
        title="Sample Project Ingested",
        details="Loaded Express Bookstore repository with Mongoose models, Express routes, and Jest tests.",
        metadata={"project_id": project_id}
    )

    # Trigger baseline analysis in background
    background_tasks.add_task(analyze_repository, project_id)
    background_tasks.add_task(build_dependency_graph, project_id)

    return {
        "success": True,
        "project_id": project_id,
        "name": "Express Bookstore API",
        "message": "Sample project ingested successfully."
    }

@router.post("/sample-python")
async def load_python_sample_project(background_tasks: BackgroundTasks):
    """
    Loads the bundled Python Flask Task API sample repository into a new active project.
    Allows 1-click testing of Python -> Spring Boot or Python -> Go/FastAPI migrations.
    """
    sample_source = BASE_DIR / "samples" / "python-taskapi"
    if not sample_source.exists():
        raise HTTPException(status_code=404, detail="Bundled Python sample project not found on server.")

    project_id = f"proj-{uuid.uuid4().hex[:8]}"
    project_dest = PROJECTS_DIR / project_id
    shutil.copytree(sample_source, project_dest)

    save_project(
        project_id=project_id,
        name="Python Task API (Flask)",
        source_framework="Python / Flask",
        target_framework="Spring Boot / Java",
        source_path=str(project_dest),
        status="INITIALIZED"
    )

    record_agent_event(
        project_id=project_id,
        category="EVIDENCE",
        agent_name="ArchaeologistAgent",
        title="Python Flask Project Ingested",
        details="Loaded Python Task API repository with SQLAlchemy Task model and Flask CRUD blueprint.",
        metadata={"project_id": project_id, "language": "python", "framework": "flask"}
    )

    background_tasks.add_task(analyze_repository, project_id)
    background_tasks.add_task(build_dependency_graph, project_id)

    return {
        "success": True,
        "project_id": project_id,
        "name": "Python Task API (Flask)",
        "source_framework": "Python / Flask",
        "message": "Python sample project ingested successfully."
    }

@router.post("/upload")
async def upload_project_zip(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = Form("Uploaded Project"),
    target_framework: str = Form("spring_boot")
):
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files are supported.")

    project_id = f"proj-{uuid.uuid4().hex[:8]}"
    project_dest = PROJECTS_DIR / project_id
    project_dest.mkdir(parents=True, exist_ok=True)

    zip_path = project_dest / file.filename
    with open(zip_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Extract ZIP
    try:
        with zipfile.ZipFile(zip_path, "r") as z:
            z.extractall(project_dest)
        zip_path.unlink()
    except Exception as e:
        shutil.rmtree(project_dest, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"Failed to unzip archive: {str(e)}")

    # Auto-detect language and framework!
    lang, fw = detect_language_and_framework(project_dest)
    detected_source = f"{lang.title()} / {fw.title()}"

    save_project(
        project_id=project_id,
        name=name,
        source_framework=detected_source,
        target_framework=target_framework,
        source_path=str(project_dest),
        status="INITIALIZED"
    )

    record_agent_event(
        project_id=project_id,
        category="EVIDENCE",
        agent_name="ArchaeologistAgent",
        title=f"Archive Ingested: {file.filename}",
        details=f"Detected architecture: {detected_source}. Target configured for {target_framework}.",
        metadata={"filename": file.filename, "detected_language": lang, "detected_framework": fw}
    )

    background_tasks.add_task(analyze_repository, project_id)
    background_tasks.add_task(build_dependency_graph, project_id)

    return {
        "success": True,
        "project_id": project_id,
        "name": name,
        "source_framework": detected_source,
        "target_framework": target_framework,
        "message": f"Archive uploaded. Auto-detected {detected_source}."
    }

