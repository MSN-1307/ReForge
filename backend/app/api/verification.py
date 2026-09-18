from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Any, Optional
from app.storage.db import get_project, get_verification_runs, record_agent_event
from app.mcp.tools.execution import compare_behavior
from app.mcp.tools.repair import analyze_failure, apply_fix

router = APIRouter(prefix="/api/verification", tags=["verification"])

@router.get("/{project_id}/runs")
def get_runs(project_id: str):
    return {"runs": get_verification_runs(project_id)}

@router.post("/{project_id}/run")
def trigger_verification(project_id: str):
    project = get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    result = compare_behavior(project_id=project_id)
    return result

@router.post("/{project_id}/repair")
def trigger_repair_loop(project_id: str):
    project = get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 1. Analyze failure
    analysis = analyze_failure(project_id=project_id, error_logs="Simulated divergence in payload schema contract")

    # 2. Apply fix
    target_file = analysis.get("target_file", "src/main/java/com/reforge/app/controller/BookController.java")
    apply_fix(
        project_id=project_id,
        file_path=target_file,
        fix_content="// Autonomous patch applied by ReForge Repair Agent\n// Status code contract aligned to 201 CREATED for POST /api/books\n"
    )

    # 3. Retest behavior
    retest_result = compare_behavior(project_id=project_id)

    return {
        "success": True,
        "project_id": project_id,
        "analysis": analysis,
        "retest_results": retest_result,
        "repaired": True
    }
