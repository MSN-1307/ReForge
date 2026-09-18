import pytest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_and_tools():
    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    # 2. MCP Tools
    tools_res = client.get("/api/mcp/tools")
    assert tools_res.status_code == 200
    tools = tools_res.json()["tools"]
    assert len(tools) >= 12

def test_full_migration_workflow_e2e():
    # 1. Load sample project
    sample_res = client.post("/api/projects/sample")
    assert sample_res.status_code == 200
    project_id = sample_res.json()["project_id"]
    assert project_id.startswith("proj-")

    # 2. Check events in Agent Activity Console (Phase 1)
    ev_res = client.get(f"/api/projects/{project_id}/events")
    assert ev_res.status_code == 200
    events = ev_res.json()["events"]
    assert len(events) >= 1
    categories = [e["category"] for e in events]
    assert "EVIDENCE" in categories

    # 3. Check React Flow Knowledge Graph (Phase 2)
    graph_res = client.get(f"/api/projects/{project_id}/graph")
    assert graph_res.status_code == 200
    gdata = graph_res.json()
    assert len(gdata["nodes"]) > 0
    assert len(gdata["edges"]) > 0
    assert gdata["summary"]["route_count"] >= 4

    # 4. Evidence-backed Codebase Chat (Phase 2)
    chat_res = client.post("/api/chat", json={
        "project_id": project_id,
        "message": "What routes and endpoints are exposed?"
    })
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert len(chat_data["evidence"]) >= 1
    assert "GET /api/books" in chat_data["reply"]

    # 5. Migration Plan generation (Phase 3)
    plan_res = client.get(f"/api/migration/{project_id}/plan")
    assert plan_res.status_code == 200
    plan = plan_res.json()
    assert plan["total_mappings"] >= 2

    # 6. Execute Migration & Modernization (Phases 3 & 5)
    exec_res = client.post(f"/api/migration/{project_id}/execute", json={
        "modernization_upgrades": ["docker", "openapi", "redis"]
    })
    assert exec_res.status_code == 200

    # 7. Check generated target files
    files_res = client.get(f"/api/migration/{project_id}/files")
    assert files_res.status_code == 200
    files = files_res.json()["files"]
    file_paths = [f["rel_path"] for f in files]
    assert "pom.xml" in file_paths
    assert "Dockerfile" in file_paths
    assert any("Book.java" in p for p in file_paths)
    assert any("BooksController.java" in p or "BookController.java" in p or "MainController.java" in p for p in file_paths)

    # 8. Check Semantic Diff Viewer data (Phase 3)
    diff_res = client.get(f"/api/migration/{project_id}/diff")
    assert diff_res.status_code == 200
    pairs = diff_res.json()["pairs"]
    assert len(pairs) >= 1

    # 9. HTTP Scenario Equivalence Verification (Phase 4)
    verify_res = client.post(f"/api/verification/{project_id}/run")
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["equivalence_score"] == 100.0

    # 10. Autonomous Repair Loop (Phase 4)
    repair_res = client.post(f"/api/verification/{project_id}/repair")
    assert repair_res.status_code == 200
    r_data = repair_res.json()
    assert r_data["repaired"] is True
    assert r_data["retest_results"]["equivalence_score"] == 100.0
