from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from pathlib import Path
import shutil
import zipfile
import uuid
from typing import List, Dict, Any, Optional
from app.config import PROJECTS_DIR, BASE_DIR
from app.storage.db import (
    save_project, list_projects, get_project, get_agent_events, record_agent_event
)
from app.mcp.tools.analysis import build_dependency_graph, analyze_repository
from app.api.ws import ws_manager

router = APIRouter(prefix="/api/projects", tags=["projects"])

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

@router.post("/upload")
async def upload_project_zip(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = Form("Uploaded Project")
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

    save_project(
        project_id=project_id,
        name=name,
        source_framework="Node.js / Express",
        target_framework="Spring Boot / Java",
        source_path=str(project_dest),
        status="INITIALIZED"
    )

    record_agent_event(
        project_id=project_id,
        category="EVIDENCE",
        agent_name="ArchaeologistAgent",
        title=f"Archive Ingested: {file.filename}",
        details=f"Unpacked repository archive to project space {project_id}",
        metadata={"filename": file.filename}
    )

    background_tasks.add_task(analyze_repository, project_id)
    background_tasks.add_task(build_dependency_graph, project_id)

    return {
        "success": True,
        "project_id": project_id,
        "name": name,
        "message": "Archive uploaded and unpacked successfully."
    }
