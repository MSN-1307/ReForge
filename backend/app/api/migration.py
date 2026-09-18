from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from pathlib import Path
import os
import shutil
import zipfile
from app.storage.db import get_project, get_migration_plan, save_migration_plan, update_project_status
from app.mcp.tools.migration import create_migration_plan
from app.orchestrator.graph import reforge_pipeline
from app.config import TARGETS_DIR, PROJECTS_DIR
from app.api.ws import ws_manager

router = APIRouter(prefix="/api/migration", tags=["migration"])

class MigrateRequest(BaseModel):
    modernization_upgrades: List[str] = ["docker", "openapi", "redis"]

@router.get("/{project_id}/plan")
def get_plan(project_id: str):
    plan = get_migration_plan(project_id)
    if not plan:
        plan = create_migration_plan(project_id)
    return plan

@router.post("/{project_id}/execute")
async def execute_migration(project_id: str, req: MigrateRequest, background_tasks: BackgroundTasks):
    project = get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    initial_state = {
        "project_id": project_id,
        "project_name": project["name"],
        "status": "STARTING",
        "events": [],
        "ast_catalog": {},
        "knowledge_graph": {},
        "migration_plan": {},
        "generated_files": [],
        "verification_results": {},
        "repair_attempts": 0,
        "max_repairs": 3,
        "needs_repair": False,
        "modernization_options": req.modernization_upgrades,
        "error": None
    }

    # Execute LangGraph pipeline
    def run_pipeline():
        try:
            reforge_pipeline.invoke(initial_state)
        except Exception as e:
            update_project_status(project_id, status=f"FAILED: {str(e)}")

    background_tasks.add_task(run_pipeline)

    return {
        "success": True,
        "project_id": project_id,
        "status": "MIGRATION_ORCHESTRATION_STARTED",
        "message": "LangGraph multi-agent pipeline dispatched."
    }

@router.get("/{project_id}/files")
def get_generated_files(project_id: str):
    target_dir = TARGETS_DIR / project_id
    if not target_dir.exists():
        return {"files": []}

    files = []
    for root, dirs, filenames in os.walk(target_dir):
        for f in filenames:
            full = Path(root) / f
            rel = str(full.relative_to(target_dir)).replace("\\", "/")
            try:
                content = full.read_text(encoding="utf-8", errors="replace")
            except Exception:
                content = ""
            files.append({
                "rel_path": rel,
                "size_bytes": full.stat().st_size,
                "lines": len(content.splitlines()),
                "content": content
            })

    return {"files": files}

@router.get("/{project_id}/diff")
def get_semantic_diff(project_id: str):
    """
    Returns paired files for Monaco Semantic Diff Viewer:
    Source Express file vs Target Spring Boot file.
    """
    project = get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    source_dir = Path(project["source_path"])
    target_dir = TARGETS_DIR / project_id

    diff_pairs = []

    # 1. Controller pair
    source_routes = source_dir / "routes" / "books.js"
    if not source_routes.exists():
        source_routes = source_dir / "server.js"

    target_controller = target_dir / "src" / "main" / "java" / "com" / "reforge" / "app" / "controller" / "BooksController.java"
    if not target_controller.exists():
        target_controller = target_dir / "src" / "main" / "java" / "com" / "reforge" / "app" / "controller" / "MainController.java"

    if source_routes.exists() and target_controller.exists():
        diff_pairs.append({
            "title": "REST API Layer: Express Router -> Spring Boot @RestController",
            "source_path": str(source_routes.relative_to(source_dir)).replace("\\", "/"),
            "source_code": source_routes.read_text(encoding="utf-8", errors="replace"),
            "target_path": str(target_controller.relative_to(target_dir)).replace("\\", "/"),
            "target_code": target_controller.read_text(encoding="utf-8", errors="replace"),
            "source_lang": "javascript",
            "target_lang": "java"
        })

    # 2. Model pair
    source_model = source_dir / "models" / "Book.js"
    target_entity = target_dir / "src" / "main" / "java" / "com" / "reforge" / "app" / "entity" / "Book.java"

    if source_model.exists() and target_entity.exists():
        diff_pairs.append({
            "title": "Data Persistence Layer: Mongoose Schema -> Spring Data JPA @Entity",
            "source_path": str(source_model.relative_to(source_dir)).replace("\\", "/"),
            "source_code": source_model.read_text(encoding="utf-8", errors="replace"),
            "target_path": str(target_entity.relative_to(target_dir)).replace("\\", "/"),
            "target_code": target_entity.read_text(encoding="utf-8", errors="replace"),
            "source_lang": "javascript",
            "target_lang": "java"
        })

    # 3. Build pair: package.json -> pom.xml
    source_pkg = source_dir / "package.json"
    target_pom = target_dir / "pom.xml"
    if source_pkg.exists() and target_pom.exists():
        diff_pairs.append({
            "title": "Build & Dependency Layer: package.json -> Maven pom.xml",
            "source_path": "package.json",
            "source_code": source_pkg.read_text(encoding="utf-8", errors="replace"),
            "target_path": "pom.xml",
            "target_code": target_pom.read_text(encoding="utf-8", errors="replace"),
            "source_lang": "json",
            "target_lang": "xml"
        })

    return {"pairs": diff_pairs}

@router.get("/{project_id}/download")
def download_project_zip(project_id: str):
    project = get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    target_dir = TARGETS_DIR / project_id
    if not target_dir.exists():
        raise HTTPException(status_code=400, detail="Target Spring Boot project has not been generated yet. Please run migration first.")

    # Create zip archive in storage dir
    zip_basename = f"spring-boot-{project_id}"
    archive_path = shutil.make_archive(str(TARGETS_DIR / zip_basename), "zip", root_dir=target_dir)

    clean_name = project["name"].lower().replace(" ", "-") + "-spring-boot.zip"
    return FileResponse(archive_path, media_type="application/zip", filename=clean_name)

