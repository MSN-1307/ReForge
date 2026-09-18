# ReForge: Autonomous Software Migration & Modernization Platform

ReForge is an enterprise AI-agentic platform that reconstructs how an unfamiliar legacy codebase works (Software Archaeologist), builds an interactive knowledge graph, deterministically plans and executes a migration from **Node.js / Express** to **Spring Boot / Java**, verifies behavioral equivalence using containerized HTTP replay, autonomously repairs compilation/test failures, and applies cloud-native modernization upgrades (OpenAPI, Docker, Redis caching).

---

## Architecture Overview

```
ReForge Platform
 ├── Frontend (React + Vite + Tailwind CSS)
 │    ├── Agent Activity Console (Observed Evidence vs. Derived Analysis vs. LLM Hypotheses)
 │    ├── Architecture Knowledge Graph (Interactive React Flow)
 │    ├── Codebase Chat (AST Evidence-Backed Q&A)
 │    ├── Semantic Diff Viewer (Monaco Editor)
 │    ├── Behavioral Equivalence & Repair Hub (HTTP Replay Matrix)
 │    └── Modernization Center (Docker, OpenAPI 3, Redis)
 │
 ├── Backend (Python 3.12 + FastAPI + WebSockets)
 │    ├── LangGraph Multi-Agent Orchestrator
 │    │    ├── ArchaeologistAgent
 │    │    ├── PlannerAgent
 │    │    ├── MigrationAgent
 │    │    ├── VerificationAgent
 │    │    ├── RepairAgent (Autonomous Loop)
 │    │    └── ModernizationAgent
 │    │
 │    ├── Controlled MCP Tool Layer
 │    │    ├── Repository / Analysis: analyze_repository, parse_code, build_dependency_graph, inspect_git_history
 │    │    ├── Execution / Verification: start_original_app, trace_runtime, run_tests, compare_behavior
 │    │    ├── Migration: create_migration_plan, generate_file, modify_file, build_project
 │    │    └── Repair / Modernization: analyze_failure, apply_fix, security_scan, modernize_project
 │    │
 │    ├── Parsing & Mapping Engines
 │    │    ├── ast_engine.py (Express route & Mongoose schema parser)
 │    │    ├── graph_engine.py (NetworkX Codebase Knowledge Graph)
 │    │    └── express_to_spring.py (Deterministic Node.js -> Spring Boot mapping)
 │    │
 │    └── Persistence: SQLite (reforge.db)
 │
 └── Samples
      └── express-bookstore (Express CRUD API with Mongoose, Middleware, and Jest tests)
```

---

## Quick Start Guide

### 1. Start FastAPI Backend
```powershell
# In project root:
.\backend\.venv\Scripts\python backend/run.py
```
Backend runs on: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`)

### 2. Start React Frontend
```powershell
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

### 3. Run Backend Test Suite
```powershell
.\backend\.venv\Scripts\pytest backend/tests/test_core.py
```

---

## 5-Phase Implementation Scope

### Phase 1: Web Platform & Ingestion
- **Agent Activity Console**: Real-time console featuring categorized logs:
  - 🟢 **Observed Evidence** (exact file paths, line numbers, raw AST nodes, HTTP status codes)
  - 🔵 **Derived Analysis** (graph metrics, structural mapping decisions, dependency links)
  - 🟣 **LLM Hypotheses** (agent reasoning, inferred intent, repair suggestions)
- **Zero-Friction Ingestion**: 1-click loading of bundled `express-bookstore` sample or custom `.zip` upload.

### Phase 2: Software Archaeologist
- **AST Parsing**: Automatic extraction of Express routes, HTTP methods, route parameters, request body access, and Mongoose schemas.
- **Codebase Knowledge Graph**: Stored in NetworkX and exported to interactive React Flow canvas with custom nodes and edges.
- **Codebase Chat**: Real-time Q&A engine citing exact AST facts and line numbers.

### Phase 3: Migration Planner & Execution
- **Deterministic Mapping Engine**:
  - Express Route $\rightarrow$ Spring Boot `@RestController`
  - Mongoose Schema $\rightarrow$ JPA `@Entity`
  - Data Access $\rightarrow$ `JpaRepository<T, ID>`
  - `package.json` $\rightarrow$ Maven `pom.xml`
- **Monaco Semantic Diff Viewer**: Side-by-side comparison of source Express files and target Spring Boot Java files.

### Phase 4: Behavioral Equivalence & Autonomous Repair
- **HTTP Scenario Replay**: Dual-runtime comparison verifying status codes, JSON payload schema equivalence, and headers.
- **Autonomous Repair Loop**: Captures failures or contract divergences, generates repair hypotheses, applies patches, and retests automatically.

### Phase 5: Modernization Center
- **Opt-in Cloud-Native Upgrades**:
  1. Multi-stage production `Dockerfile` and `docker-compose.yml`
  2. Interactive OpenAPI 3 / Swagger Documentation (`springdoc-openapi`)
  3. Redis Distributed Caching (`@EnableCaching`, Redis cache configuration)
