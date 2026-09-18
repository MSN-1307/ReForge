import pytest
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import BASE_DIR
from app.parser.ast_engine import ast_parser
from app.parser.graph_engine import CodebaseKnowledgeGraph
from app.mapping.express_to_spring import mapping_engine
from app.mcp.registry import mcp_registry
from app.storage.db import init_db, save_project, get_project
import app.mcp.tools

def test_mcp_registry_tools():
    tools = mcp_registry.list_tools()
    assert len(tools) >= 12
    tool_names = [t["name"] for t in tools]
    assert "analyze_repository" in tool_names
    assert "parse_code" in tool_names
    assert "build_dependency_graph" in tool_names
    assert "compare_behavior" in tool_names
    assert "create_migration_plan" in tool_names
    assert "generate_file" in tool_names
    assert "modernize_project" in tool_names

def test_ast_parsing_sample_bookstore():
    sample_dir = BASE_DIR / "samples" / "express-bookstore"
    routes_file = sample_dir / "routes" / "books.js"
    model_file = sample_dir / "models" / "Book.js"

    # Parse routes
    routes_ast = ast_parser.parse_file(routes_file)
    assert len(routes_ast["routes"]) >= 4
    methods = [r["method"] for r in routes_ast["routes"]]
    assert "GET" in methods
    assert "POST" in methods
    assert "DELETE" in methods

    # Parse models
    model_ast = ast_parser.parse_file(model_file)
    assert len(model_ast["models"]) >= 1
    assert model_ast["models"][0]["name"] == "Book"
    fields = model_ast["models"][0]["fields"]
    assert "title" in fields
    assert "price" in fields

def test_knowledge_graph_generation():
    sample_dir = BASE_DIR / "samples" / "express-bookstore"
    catalog = {
        "routes/books.js": ast_parser.parse_file(sample_dir / "routes" / "books.js"),
        "models/Book.js": ast_parser.parse_file(sample_dir / "models" / "Book.js"),
    }
    kg = CodebaseKnowledgeGraph(sample_dir)
    kg.build_from_ast(catalog)
    react_flow = kg.to_react_flow()

    assert len(react_flow["nodes"]) > 0
    assert len(react_flow["edges"]) > 0
    assert react_flow["summary"]["route_count"] >= 4
    assert react_flow["summary"]["model_count"] >= 1

def test_express_to_spring_mapping():
    # Test Entity mapping
    model_def = {
        "name": "Book",
        "fields": {
            "title": {"type": "String", "required": True},
            "price": {"type": "Number", "required": True},
            "inStock": {"type": "Boolean", "required": False}
        }
    }
    rel_path, java_code = mapping_engine.map_model_to_jpa_entity(model_def)
    assert "package com.reforge.app.entity;" in java_code
    assert "@Entity" in java_code
    assert "private Double price;" in java_code
    assert "public Long getId()" in java_code

    # Test Controller mapping
    routes = [
        {"method": "GET", "path": "/api/books", "path_params": [], "status_code": 200},
        {"method": "POST", "path": "/api/books", "path_params": [], "status_code": 201},
        {"method": "GET", "path": "/api/books/:id", "path_params": ["id"], "status_code": 200}
    ]
    ctrl_path, ctrl_code = mapping_engine.map_routes_to_controller("Book", "/api/books", routes, "Book")
    assert "@RestController" in ctrl_code
    assert "@RequestMapping(\"/api/books\")" in ctrl_code
    assert "@GetMapping" in ctrl_code
    assert "@PostMapping" in ctrl_code
    assert "@PathVariable Long id" in ctrl_code

    # Test Pom.xml generation
    pom_path, pom_code = mapping_engine.generate_pom_xml("Bookstore API", upgrades=["openapi", "redis"])
    assert "spring-boot-starter-web" in pom_code
    assert "springdoc-openapi-starter-webmvc-ui" in pom_code
    assert "spring-boot-starter-data-redis" in pom_code

def test_full_project_ingestion_and_mcp():
    sample_dir = BASE_DIR / "samples" / "express-bookstore"
    test_proj_id = "test-proj-001"
    save_project(
        project_id=test_proj_id,
        name="Bookstore API Test",
        source_framework="Node.js / Express",
        target_framework="Spring Boot / Java",
        source_path=str(sample_dir),
        status="INITIALIZED"
    )

    # 1. analyze_repository
    analysis = mcp_registry.execute("analyze_repository", project_id=test_proj_id)
    assert analysis["success"] is True
    assert "Express.js" in analysis["result"]["frameworks"]

    # 2. create_migration_plan
    plan = mcp_registry.execute("create_migration_plan", project_id=test_proj_id)
    assert plan["success"] is True
    assert plan["result"]["total_mappings"] > 0

    # 3. compare_behavior
    comparison = mcp_registry.execute("compare_behavior", project_id=test_proj_id)
    assert comparison["success"] is True
    assert comparison["result"]["equivalence_score"] == 100.0
