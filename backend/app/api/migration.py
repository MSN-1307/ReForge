from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from pathlib import Path
import os
import shutil
import zipfile
from app.storage.db import get_project, save_project, get_migration_plan, save_migration_plan, update_project_status
from app.mcp.tools.migration import create_migration_plan
from app.orchestrator.graph import reforge_pipeline
from app.config import TARGETS_DIR, PROJECTS_DIR
from app.api.ws import ws_manager

router = APIRouter(prefix="/api/migration", tags=["migration"])

class MigrateRequest(BaseModel):
    target_framework: str = "spring_boot"
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

    # Update project with desired target framework
    if req.target_framework:
        save_project(
            project_id=project_id,
            name=project["name"],
            source_framework=project["source_framework"],
            target_framework=req.target_framework,
            source_path=project["source_path"],
            target_path=project.get("target_path"),
            status="STARTING"
        )
        project = get_project(project_id)

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
    Source file vs Target generated file across any language pair.
    """
    project = get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    source_dir = Path(project["source_path"])
    target_dir = TARGETS_DIR / project_id

    diff_pairs = []
    if not target_dir.exists():
        return {"pairs": []}

    # Language mapping helper
    def lang_for_ext(path_str):
        ext = Path(path_str).suffix.lower()
        mapping = {
            ".java": "java", ".py": "python", ".js": "javascript",
            ".ts": "typescript", ".go": "go", ".json": "json",
            ".xml": "xml", ".properties": "ini", ".yml": "yaml",
            ".yaml": "yaml", ".md": "markdown", ".txt": "plaintext"
        }
        return mapping.get(ext, "plaintext")

    # Look for matching target files:
    # 1. Routes / Controllers
    target_route_candidates = list(target_dir.glob("**/controller/*.java")) + \
                              list(target_dir.glob("**/routes.py")) + \
                              list(target_dir.glob("**/routes.go")) + \
                              list(target_dir.glob("**/routes/api.js"))

    source_route_candidates = list(source_dir.glob("**/routes/*.js")) + \
                              list(source_dir.glob("**/routes.py")) + \
                              list(source_dir.glob("**/views.py")) + \
                              list(source_dir.glob("**/server.js")) + \
                              list(source_dir.glob("**/app.py"))

    if source_route_candidates and target_route_candidates:
        src = source_route_candidates[0]
        tgt = target_route_candidates[0]
        diff_pairs.append({
            "title": f"REST Routing Layer: {src.name} -> {tgt.name}",
            "source_path": str(src.relative_to(source_dir)).replace("\\", "/"),
            "source_code": src.read_text(encoding="utf-8", errors="replace"),
            "target_path": str(tgt.relative_to(target_dir)).replace("\\", "/"),
            "target_code": tgt.read_text(encoding="utf-8", errors="replace"),
            "source_lang": lang_for_ext(src.name),
            "target_lang": lang_for_ext(tgt.name)
        })

    # 2. Models / Entities
    target_model_candidates = list(target_dir.glob("**/entity/*.java")) + \
                             list(target_dir.glob("**/models.py")) + \
                             list(target_dir.glob("**/models.go")) + \
                             list(target_dir.glob("**/models/*.js"))

    source_model_candidates = list(source_dir.glob("**/models/*.js")) + \
                             list(source_dir.glob("**/models.py")) + \
                             list(source_dir.glob("**/models/*.py"))

    if source_model_candidates and target_model_candidates:
        src = source_model_candidates[0]
        tgt = target_model_candidates[0]
        diff_pairs.append({
            "title": f"Data Model Layer: {src.name} -> {tgt.name}",
            "source_path": str(src.relative_to(source_dir)).replace("\\", "/"),
            "source_code": src.read_text(encoding="utf-8", errors="replace"),
            "target_path": str(tgt.relative_to(target_dir)).replace("\\", "/"),
            "target_code": tgt.read_text(encoding="utf-8", errors="replace"),
            "source_lang": lang_for_ext(src.name),
            "target_lang": lang_for_ext(tgt.name)
        })

    # 3. Build / Dependency config
    target_build = [f for f in ["pom.xml", "requirements.txt", "go.mod", "package.json"] if (target_dir / f).exists()]
    source_build = [f for f in ["package.json", "requirements.txt", "pom.xml", "go.mod"] if (source_dir / f).exists()]

    if source_build and target_build:
        src_f = source_dir / source_build[0]
        tgt_f = target_dir / target_build[0]
        diff_pairs.append({
            "title": f"Build & Dependency Layer: {src_f.name} -> {tgt_f.name}",
            "source_path": str(src_f.relative_to(source_dir)).replace("\\", "/"),
            "source_code": src_f.read_text(encoding="utf-8", errors="replace"),
            "target_path": str(tgt_f.relative_to(target_dir)).replace("\\", "/"),
            "target_code": tgt_f.read_text(encoding="utf-8", errors="replace"),
            "source_lang": lang_for_ext(src_f.name),
            "target_lang": lang_for_ext(tgt_f.name)
        })

    # 4. Dockerization comparison if present
    if (target_dir / "Dockerfile").exists():
        tgt_f = target_dir / "Dockerfile"
        src_f = source_dir / "Dockerfile" if (source_dir / "Dockerfile").exists() else None
        src_code = src_f.read_text(encoding="utf-8", errors="replace") if src_f else "# No legacy Dockerfile found in source project"
        diff_pairs.append({
            "title": "Containerization: Multi-stage Production Dockerfile",
            "source_path": "Dockerfile (legacy)" if src_f else "Legacy Environment",
            "source_code": src_code,
            "target_path": "Dockerfile",
            "target_code": tgt_f.read_text(encoding="utf-8", errors="replace"),
            "source_lang": "dockerfile",
            "target_lang": "dockerfile"
        })

    return {"pairs": diff_pairs}

@router.get("/{project_id}/download")
def download_project_zip(project_id: str):
    project = get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    target_dir = TARGETS_DIR / project_id
    if not target_dir.exists():
        raise HTTPException(status_code=400, detail="Target project has not been generated yet. Please run migration first.")

    target_fw = project.get("target_framework", "target").lower().replace(" ", "-")
    zip_basename = f"{target_fw}-{project_id}"
    archive_path = shutil.make_archive(str(TARGETS_DIR / zip_basename), "zip", root_dir=target_dir)

    clean_name = f"{project['name'].lower().replace(' ', '-')}-{target_fw}.zip"
    return FileResponse(archive_path, media_type="application/zip", filename=clean_name)

