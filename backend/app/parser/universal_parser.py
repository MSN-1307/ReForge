"""
Universal Codebase Parser for ReForge V2.
Detects source language and extracts language-agnostic concepts:
Routes, Models, Middleware, Config, Auth — from any supported language.
"""
import re
import os
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field


# ─── Universal Data Structures ────────────────────────────────────────────────

@dataclass
class UniversalRoute:
    method: str          # GET, POST, PUT, DELETE, PATCH
    path: str            # e.g. /api/users/:id  or  /api/users/{id}
    handler: str         # Function/method name
    file: str            # Relative source file
    line: int
    path_params: List[str] = field(default_factory=list)
    body_fields: List[str] = field(default_factory=list)
    query_params: List[str] = field(default_factory=list)
    auth_required: bool = False
    status_code: int = 200
    middlewares: List[str] = field(default_factory=list)


@dataclass
class UniversalField:
    name: str
    type: str           # String, Integer, Float, Boolean, DateTime, List
    required: bool = False
    unique: bool = False
    default: Optional[str] = None


@dataclass
class UniversalModel:
    name: str
    table_name: str
    fields: List[UniversalField]
    file: str
    line: int


@dataclass
class UniversalMiddleware:
    name: str
    type: str           # auth, cors, logging, rate_limit, validation, custom
    file: str
    line: int


@dataclass
class UniversalProject:
    name: str
    source_language: str        # python, javascript, typescript, php, ruby, go
    source_framework: str       # flask, fastapi, django, express, nestjs, laravel, rails
    routes: List[UniversalRoute]
    models: List[UniversalModel]
    middlewares: List[UniversalMiddleware]
    dependencies: Dict[str, str]
    entry_point: str
    port: int = 8000
    has_auth: bool = False
    has_db: bool = False
    db_type: str = "sql"        # sql, mongodb, none
    env_vars: List[str] = field(default_factory=list)


# ─── Language Detection ────────────────────────────────────────────────────────

LANGUAGE_SIGNATURES = {
    "python": {
        "extensions": [".py"],
        "config_files": ["requirements.txt", "Pipfile", "pyproject.toml", "setup.py"],
        "frameworks": {
            "flask": ["from flask import", "Flask(__name__)", "@app.route", "Blueprint"],
            "fastapi": ["from fastapi import", "FastAPI()", "@router.", "APIRouter"],
            "django": ["from django", "urlpatterns", "views.py", "models.py", "django.db"],
        }
    },
    "javascript": {
        "extensions": [".js", ".mjs"],
        "config_files": ["package.json"],
        "frameworks": {
            "express": ["require('express')", 'require("express")', "express()", "router.get", "app.get"],
            "nestjs": ["@Module", "@Controller", "@Injectable", "NestFactory"],
            "koa": ["require('koa')", "new Koa()"],
        }
    },
    "typescript": {
        "extensions": [".ts"],
        "config_files": ["tsconfig.json", "package.json"],
        "frameworks": {
            "nestjs": ["@Module", "@Controller", "@Injectable", "NestFactory"],
            "express": ["import express", "from 'express'", "Router()"],
            "fastify": ["import fastify", "from 'fastify'"],
        }
    },
    "php": {
        "extensions": [".php"],
        "config_files": ["composer.json"],
        "frameworks": {
            "laravel": ["Illuminate\\", "Route::get", "use App\\"],
            "symfony": ["Symfony\\", "use Symfony"],
        }
    },
    "ruby": {
        "extensions": [".rb"],
        "config_files": ["Gemfile"],
        "frameworks": {
            "rails": ["Rails.application", "ActiveRecord", "ApplicationRecord"],
            "sinatra": ["require 'sinatra'", "Sinatra::Base"],
        }
    },
    "go": {
        "extensions": [".go"],
        "config_files": ["go.mod"],
        "frameworks": {
            "gin": ["github.com/gin-gonic/gin", "gin.Default()", "gin.New()"],
            "echo": ["github.com/labstack/echo", "echo.New()"],
        }
    },
}

def detect_language_and_framework(project_path: Path) -> Tuple[str, str]:
    """Auto-detects source language and framework from project files."""
    all_content = ""
    ext_counts: Dict[str, int] = {}

    for root, dirs, files in os.walk(project_path):
        dirs[:] = [d for d in dirs if d not in [
            "node_modules", ".git", "__pycache__", ".venv", "venv",
            "dist", "build", ".idea", ".vscode", "vendor"
        ]]
        for f in files:
            suffix = Path(f).suffix.lower()
            ext_counts[suffix] = ext_counts.get(suffix, 0) + 1
            full = Path(root) / f
            if suffix in [".py", ".js", ".ts", ".php", ".rb", ".go", ".json"]:
                try:
                    all_content += full.read_text(encoding="utf-8", errors="replace")[:2000]
                except Exception:
                    pass

    # Detect language by dominant extension + config files
    for lang, sig in LANGUAGE_SIGNATURES.items():
        has_config = any((project_path / cfg).exists() for cfg in sig["config_files"])
        has_ext = any(ext_counts.get(e, 0) > 0 for e in sig["extensions"])

        if has_config or has_ext:
            # Detect framework
            for framework, patterns in sig["frameworks"].items():
                if any(p in all_content for p in patterns):
                    return lang, framework

            # Default framework
            defaults = {"python": "flask", "javascript": "express", "typescript": "nestjs",
                        "php": "laravel", "ruby": "rails", "go": "gin"}
            return lang, defaults.get(lang, "unknown")

    return "javascript", "express"


# ─── Python Parsers ────────────────────────────────────────────────────────────

class PythonFlaskParser:
    def parse(self, project_path: Path) -> Tuple[List[UniversalRoute], List[UniversalModel], List[UniversalMiddleware]]:
        routes, models, middlewares = [], [], []
        for root, dirs, files in os.walk(project_path):
            dirs[:] = [d for d in dirs if d not in ["__pycache__", ".venv", "venv", ".git"]]
            for f in files:
                if not f.endswith(".py"):
                    continue
                full = Path(root) / f
                rel = str(full.relative_to(project_path)).replace("\\", "/")
                content = full.read_text(encoding="utf-8", errors="replace")
                lines = content.splitlines()
                routes.extend(self._extract_flask_routes(lines, rel))
                models.extend(self._extract_sqlalchemy_models(content, rel))
                middlewares.extend(self._extract_middlewares(lines, rel))
        return routes, models, middlewares

    def _extract_flask_routes(self, lines: List[str], file: str) -> List[UniversalRoute]:
        routes = []
        route_re = re.compile(r"@(?:app|bp|blueprint|api|router)\.route\s*\(['\"]([^'\"]+)['\"](?:[^)]*methods\s*=\s*\[([^\]]*)\])?")
        method_re = re.compile(r"@(?:app|bp|blueprint|api|router)\.(get|post|put|delete|patch)\s*\(['\"]([^'\"]+)['\"]")
        def_re = re.compile(r"^def\s+(\w+)\s*\(")

        i = 0
        while i < len(lines):
            line = lines[i]
            rm = route_re.search(line)
            mm = method_re.search(line)
            if rm:
                path = rm.group(1)
                methods_str = rm.group(2) or "'GET'"
                methods = [m.strip().strip("'\"") for m in methods_str.split(",")]
                handler = ""
                for j in range(i + 1, min(i + 5, len(lines))):
                    dm = def_re.match(lines[j])
                    if dm:
                        handler = dm.group(1)
                        break
                params = re.findall(r"<(?:\w+:)?(\w+)>", path)
                spring_path = re.sub(r"<(?:\w+:)?(\w+)>", r"{\1}", path)
                for method in methods:
                    routes.append(UniversalRoute(
                        method=method.upper(), path=spring_path,
                        handler=handler, file=file, line=i + 1,
                        path_params=params, status_code=201 if method.upper() == "POST" else 200
                    ))
            elif mm:
                method, path = mm.group(1).upper(), mm.group(2)
                handler = ""
                for j in range(i + 1, min(i + 5, len(lines))):
                    dm = def_re.match(lines[j])
                    if dm:
                        handler = dm.group(1)
                        break
                params = re.findall(r"<(?:\w+:)?(\w+)>", path)
                spring_path = re.sub(r"<(?:\w+:)?(\w+)>", r"{\1}", path)
                routes.append(UniversalRoute(
                    method=method, path=spring_path, handler=handler,
                    file=file, line=i + 1, path_params=params,
                    status_code=201 if method == "POST" else 200
                ))
            i += 1
        return routes

    def _extract_sqlalchemy_models(self, content: str, file: str) -> List[UniversalModel]:
        models = []
        class_re = re.compile(r"class\s+(\w+)\s*\((?:db\.Model|Base|DeclarativeBase)[^\)]*\)")
        col_re = re.compile(r"(\w+)\s*=\s*(?:db\.Column|Column)\s*\(([^)]+)\)")
        type_map = {
            "String": "String", "Integer": "Integer", "Float": "Float",
            "Boolean": "Boolean", "DateTime": "DateTime", "Text": "String"
        }
        for cm in class_re.finditer(content):
            name = cm.group(1)
            block = content[cm.start():cm.start() + 600]
            fields = []
            for col in col_re.finditer(block):
                fname, fspec = col.group(1), col.group(2)
                if fname.startswith("_"):
                    continue
                raw_type = "String"
                for t in type_map:
                    if t in fspec:
                        raw_type = type_map[t]
                        break
                fields.append(UniversalField(
                    name=fname, type=raw_type,
                    required="nullable=False" in fspec,
                    unique="unique=True" in fspec
                ))
            if fields:
                models.append(UniversalModel(
                    name=name, table_name=name.lower() + "s",
                    fields=fields, file=file, line=content[:cm.start()].count("\n") + 1
                ))
        return models

    def _extract_middlewares(self, lines: List[str], file: str) -> List[UniversalMiddleware]:
        mws = []
        for i, line in enumerate(lines, 1):
            if "CORS(" in line or "flask_cors" in line:
                mws.append(UniversalMiddleware("CORS", "cors", file, i))
            if "JWTManager" in line or "jwt_required" in line:
                mws.append(UniversalMiddleware("JWT", "auth", file, i))
            if "login_required" in line:
                mws.append(UniversalMiddleware("LoginRequired", "auth", file, i))
        return mws


class PythonFastAPIParser(PythonFlaskParser):
    def _extract_flask_routes(self, lines: List[str], file: str) -> List[UniversalRoute]:
        routes = []
        route_re = re.compile(r"@(?:app|router|api)\.(?:get|post|put|delete|patch)\s*\(['\"]([^'\"]+)['\"]")
        method_re = re.compile(r"@(?:app|router|api)\.(get|post|put|delete|patch)")
        def_re = re.compile(r"^(?:async\s+)?def\s+(\w+)\s*\(")
        for i, line in enumerate(lines, 1):
            mm = method_re.search(line)
            pm = route_re.search(line)
            if pm or mm:
                method = mm.group(1).upper() if mm else "GET"
                path_match = route_re.search(line)
                if not path_match:
                    continue
                path = path_match.group(1)
                handler = ""
                for j in range(i, min(i + 4, len(lines))):
                    dm = def_re.match(lines[j])
                    if dm:
                        handler = dm.group(1)
                        break
                params = re.findall(r"\{(\w+)\}", path)
                routes.append(UniversalRoute(
                    method=method, path=path, handler=handler,
                    file=file, line=i, path_params=params,
                    status_code=201 if method == "POST" else 200
                ))
        return routes


class JavaScriptExpressParser:
    HTTP_METHODS = ["get", "post", "put", "delete", "patch", "options"]

    def parse(self, project_path: Path):
        routes, models, middlewares = [], [], []
        for root, dirs, files in os.walk(project_path):
            dirs[:] = [d for d in dirs if d not in ["node_modules", ".git", "dist", "build"]]
            for f in files:
                if not f.endswith((".js", ".ts", ".mjs")):
                    continue
                full = Path(root) / f
                rel = str(full.relative_to(project_path)).replace("\\", "/")
                content = full.read_text(encoding="utf-8", errors="replace")
                lines = content.splitlines()
                routes.extend(self._extract_routes(lines, rel))
                models.extend(self._extract_mongoose(content, rel))
                middlewares.extend(self._extract_middlewares(lines, rel))
        return routes, models, middlewares

    def _extract_routes(self, lines, file):
        routes = []
        methods = "|".join(self.HTTP_METHODS)
        route_re = re.compile(rf"(?:app|router)\.({methods})\s*\(\s*['\"]([^'\"]+)['\"]")
        for i, line in enumerate(lines, 1):
            m = route_re.search(line)
            if m:
                method, path = m.group(1).upper(), m.group(2)
                params = re.findall(r":(\w+)", path)
                spring_path = re.sub(r":(\w+)", r"{\1}", path)
                body_fields = []
                lookahead = "\n".join(lines[i - 1:min(i + 25, len(lines))])
                for bd in re.findall(r"(?:const|let|var)\s+\{([^}]+)\}\s*=\s*req\.body", lookahead):
                    body_fields.extend([f.strip() for f in bd.split(",") if f.strip()])
                auth = "authMiddleware" in line or "authenticate" in line or "verifyToken" in line
                sc_match = re.search(r"res\.status\((\d{3})\)", lookahead)
                sc = int(sc_match.group(1)) if sc_match else (201 if method == "POST" else 200)
                routes.append(UniversalRoute(
                    method=method, path=spring_path, handler="",
                    file=file, line=i, path_params=params,
                    body_fields=body_fields, auth_required=auth, status_code=sc
                ))
        return routes

    def _extract_mongoose(self, content, file):
        models = []
        schema_re = re.compile(r"(?:const|let|var)\s+(\w+Schema)\s*=\s*new\s+(?:mongoose\.)?Schema\s*\(\s*\{([\s\S]*?)\}\s*(?:,[\s\S]*?)?\)", re.MULTILINE)
        model_re = re.compile(r"(?:mongoose\.)?model\s*\(\s*['\"](\w+)['\"]\s*,\s*(\w+)\s*\)")
        type_map = {"String": "String", "Number": "Float", "Boolean": "Boolean", "Date": "DateTime"}
        schema_map = {}
        for sm in schema_re.finditer(content):
            var, raw = sm.group(1), sm.group(2)
            fields = []
            for fm in re.finditer(r"(\w+)\s*:\s*(?:\{\s*type\s*:\s*(\w+)(?:[^}]*required\s*:\s*(true|false))?[^}]*\}|(\w+))", raw):
                fname = fm.group(1)
                ftype = fm.group(2) or fm.group(4) or "String"
                req = fm.group(3) == "true"
                fields.append(UniversalField(name=fname, type=type_map.get(ftype, "String"), required=req))
            schema_map[var] = fields
        for mm in model_re.finditer(content):
            mname, svar = mm.group(1), mm.group(2)
            models.append(UniversalModel(
                name=mname, table_name=mname.lower() + "s",
                fields=schema_map.get(svar, []), file=file,
                line=content[:mm.start()].count("\n") + 1
            ))
        return models

    def _extract_middlewares(self, lines, file):
        mws = []
        for i, line in enumerate(lines, 1):
            if "cors(" in line.lower():
                mws.append(UniversalMiddleware("CORS", "cors", file, i))
            if "jwt" in line.lower() or "jsonwebtoken" in line.lower():
                mws.append(UniversalMiddleware("JWT", "auth", file, i))
        return mws


# ─── Universal Parser Entry Point ─────────────────────────────────────────────

class UniversalParser:
    def parse_project(self, project_path: Path, project_name: str) -> UniversalProject:
        lang, framework = detect_language_and_framework(project_path)

        # Pick the right sub-parser
        if lang == "python" and framework == "fastapi":
            parser = PythonFastAPIParser()
        elif lang == "python":
            parser = PythonFlaskParser()
        else:
            parser = JavaScriptExpressParser()

        routes, models, middlewares = parser.parse(project_path)

        # Detect dependencies
        deps = {}
        pkg = project_path / "package.json"
        req = project_path / "requirements.txt"
        if pkg.exists():
            try:
                data = json.loads(pkg.read_text())
                deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
            except Exception:
                pass
        elif req.exists():
            for line in req.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith("#"):
                    parts = re.split(r"[>=<!=]", line, maxsplit=1)
                    deps[parts[0].strip()] = parts[1].strip() if len(parts) > 1 else ""

        has_auth = any(m.type == "auth" for m in middlewares)
        has_db = bool(models) or any(k in deps for k in ["mongoose", "sqlalchemy", "sequelize", "psycopg2", "pymysql"])
        db_type = "mongodb" if "mongoose" in deps else "sql"

        return UniversalProject(
            name=project_name,
            source_language=lang,
            source_framework=framework,
            routes=routes,
            models=models,
            middlewares=middlewares,
            dependencies=deps,
            entry_point="main.py" if lang == "python" else "server.js",
            has_auth=has_auth,
            has_db=has_db,
            db_type=db_type
        )

universal_parser = UniversalParser()
