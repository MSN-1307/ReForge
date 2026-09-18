import sqlite3
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.config import DB_PATH

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            source_framework TEXT NOT NULL,
            target_framework TEXT NOT NULL,
            source_path TEXT NOT NULL,
            target_path TEXT,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS agent_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL,
            category TEXT NOT NULL, -- 'EVIDENCE', 'ANALYSIS', 'HYPOTHESIS'
            agent_name TEXT NOT NULL,
            title TEXT NOT NULL,
            details TEXT,
            metadata TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS migration_plans (
            project_id TEXT PRIMARY KEY,
            plan_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS verification_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL,
            status TEXT NOT NULL,
            total_tests INTEGER DEFAULT 0,
            passed_tests INTEGER DEFAULT 0,
            failed_tests INTEGER DEFAULT 0,
            equivalence_score REAL DEFAULT 0.0,
            results_json TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )
    """)
    conn.commit()
    conn.close()

def save_project(project_id: str, name: str, source_framework: str, target_framework: str, source_path: str, target_path: Optional[str] = None, status: str = "INITIALIZED"):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO projects (id, name, source_framework, target_framework, source_path, target_path, status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name=excluded.name,
            source_framework=excluded.source_framework,
            target_framework=excluded.target_framework,
            source_path=excluded.source_path,
            target_path=excluded.target_path,
            status=excluded.status,
            updated_at=excluded.updated_at
    """, (project_id, name, source_framework, target_framework, source_path, target_path, status, datetime.now(timezone.utc).isoformat()))
    conn.commit()
    conn.close()

def update_project_status(project_id: str, status: str, target_path: Optional[str] = None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if target_path:
        cursor.execute("UPDATE projects SET status = ?, target_path = ?, updated_at = ? WHERE id = ?", (status, target_path, datetime.now(timezone.utc).isoformat(), project_id))
    else:
        cursor.execute("UPDATE projects SET status = ?, updated_at = ? WHERE id = ?", (status, datetime.now(timezone.utc).isoformat(), project_id))
    conn.commit()
    conn.close()

def get_project(project_id: str) -> Optional[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def list_projects() -> List[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def record_agent_event(project_id: str, category: str, agent_name: str, title: str, details: str = "", metadata: Optional[Dict[str, Any]] = None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO agent_events (project_id, category, agent_name, title, details, metadata, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (project_id, category.upper(), agent_name, title, details, json.dumps(metadata or {}), datetime.now(timezone.utc).isoformat()))
    conn.commit()
    conn.close()

def get_agent_events(project_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM agent_events WHERE project_id = ? ORDER BY id ASC LIMIT ?", (project_id, limit))
    rows = cursor.fetchall()
    conn.close()
    events = []
    for r in rows:
        d = dict(r)
        if d.get("metadata"):
            try:
                d["metadata"] = json.loads(d["metadata"])
            except Exception:
                pass
        events.append(d)
    return events

def save_migration_plan(project_id: str, plan: Dict[str, Any]):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO migration_plans (project_id, plan_json)
        VALUES (?, ?)
        ON CONFLICT(project_id) DO UPDATE SET plan_json = excluded.plan_json
    """, (project_id, json.dumps(plan)))
    conn.commit()
    conn.close()

def get_migration_plan(project_id: str) -> Optional[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT plan_json FROM migration_plans WHERE project_id = ?", (project_id,))
    row = cursor.fetchone()
    conn.close()
    return json.loads(row[0]) if row else None

def record_verification_run(project_id: str, status: str, total_tests: int, passed_tests: int, failed_tests: int, equivalence_score: float, results: List[Dict[str, Any]]):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO verification_runs (project_id, status, total_tests, passed_tests, failed_tests, equivalence_score, results_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (project_id, status, total_tests, passed_tests, failed_tests, equivalence_score, json.dumps(results)))
    conn.commit()
    conn.close()

def get_verification_runs(project_id: str) -> List[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM verification_runs WHERE project_id = ? ORDER BY id DESC", (project_id,))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        if d.get("results_json"):
            try:
                d["results_json"] = json.loads(d["results_json"])
            except Exception:
                pass
        result.append(d)
    return result

# Auto-initialize DB on import
init_db()
