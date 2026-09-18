"""
Python FastAPI code generator for ReForge V2 Universal Mapper.
"""
from typing import List, Tuple
from app.parser.universal_parser import UniversalProject, UniversalRoute, UniversalModel

TYPE_MAP = {
    "String": "str", "Integer": "int", "Float": "float",
    "Boolean": "bool", "DateTime": "datetime", "List": "List[str]"
}

def generate_fastapi(project: UniversalProject, upgrades: List[str] = None) -> List[Tuple[str, str]]:
    upgrades = upgrades or []
    files = []
    files.append(_requirements(project, upgrades))
    files.append(_main_py(project))
    if project.models:
        files.append(_models_py(project.models))
    if project.routes:
        files.append(_routes_py(project.routes, project.models))
    files.append(_database_py())
    if "docker" in upgrades:
        files.append(_dockerfile())
    return files


def _py_type(t: str) -> str:
    return TYPE_MAP.get(t, "str")


def _requirements(project: UniversalProject, upgrades: List[str]) -> Tuple[str, str]:
    pkgs = ["fastapi>=0.110.0", "uvicorn[standard]>=0.28.0",
            "sqlalchemy>=2.0.0", "pydantic>=2.0.0"]
    if "redis" in upgrades:
        pkgs.append("redis>=5.0.0\nfastapi-cache2>=0.2.1")
    if "docker" not in upgrades:
        pkgs.append("aiosqlite>=0.20.0")
    return "requirements.txt", "\n".join(pkgs) + "\n"


def _main_py(project: UniversalProject) -> Tuple[str, str]:
    content = f'''"""
FastAPI Application migrated from {project.source_language}/{project.source_framework} by ReForge
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import routes

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="{project.name}",
    description="Migrated from {project.source_framework} by ReForge",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)


@app.get("/health")
def health():
    return {{"status": "UP", "service": "{project.name}"}}
'''
    return "main.py", content


def _models_py(models: List[UniversalModel]) -> Tuple[str, str]:
    blocks = ['from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, func\n'
              'from sqlalchemy.ext.declarative import declarative_base\n'
              'from pydantic import BaseModel\n'
              'from typing import Optional\n'
              'from datetime import datetime\n'
              'from database import Base\n\n']
    pydantic_blocks = []
    for m in models:
        fields = []
        py_fields = []
        for f in m.fields:
            if f.name.lower() in ("id", "_id"):
                continue
            sa_type = {"String": "String", "Integer": "Integer", "Float": "Float",
                       "Boolean": "Boolean", "DateTime": "DateTime"}.get(f.type, "String")
            null = "" if f.required else ", nullable=True"
            fields.append(f"    {f.name} = Column({sa_type}{null})")
            opt = "" if f.required else "Optional[" + _py_type(f.type) + "]"
            pt = _py_type(f.type) if f.required else f"Optional[{_py_type(f.type)}]"
            py_fields.append(f"    {f.name}: {pt} = None")

        blocks.append(f'''class {m.name}(Base):
    __tablename__ = "{m.table_name}"
    id = Column(Integer, primary_key=True, index=True)
{chr(10).join(fields)}

''')
        pydantic_blocks.append(f'''class {m.name}Schema(BaseModel):
{chr(10).join(py_fields)}
    class Config:
        from_attributes = True

''')

    return "models.py", "".join(blocks) + "\n" + "".join(pydantic_blocks)


def _routes_py(routes: List[UniversalRoute], models: List[UniversalModel]) -> Tuple[str, str]:
    model_name = models[0].name if models else "Item"
    method_map = {"GET": "get", "POST": "post", "PUT": "put", "DELETE": "delete", "PATCH": "patch"}

    header = f'''from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models

router = APIRouter()

'''
    route_blocks = []
    for r in routes:
        verb = method_map.get(r.method, "get")
        path = r.path

        # Build function signature
        params = []
        for p in r.path_params:
            params.append(f"{p}: int")
        if r.method in ("POST", "PUT", "PATCH"):
            params.append(f"payload: models.{model_name}Schema")
        params.append("db: Session = Depends(get_db)")
        params_str = ", ".join(params)

        # Status code
        sc_kwarg = f', status_code={r.status_code}' if r.status_code == 201 else ""
        ret_type = f"List[models.{model_name}Schema]" if (r.method == "GET" and not r.path_params) else f"models.{model_name}Schema"

        # Body
        if r.method == "GET" and not r.path_params:
            body = f"return db.query(models.{model_name}).all()"
            ret_type = f"List[models.{model_name}Schema]"
        elif r.method == "GET":
            p0 = r.path_params[0] if r.path_params else "id"
            body = f"""item = db.query(models.{model_name}).filter(models.{model_name}.id == {p0}).first()
    if not item:
        raise HTTPException(status_code=404, detail="{model_name} not found")
    return item"""
        elif r.method == "POST":
            body = f"""db_item = models.{model_name}(**payload.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item"""
        elif r.method in ("PUT", "PATCH"):
            p0 = r.path_params[0] if r.path_params else "id"
            body = f"""db_item = db.query(models.{model_name}).filter(models.{model_name}.id == {p0}).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="{model_name} not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(db_item, k, v)
    db.commit()
    db.refresh(db_item)
    return db_item"""
        elif r.method == "DELETE":
            p0 = r.path_params[0] if r.path_params else "id"
            ret_type = "dict"
            body = f"""db_item = db.query(models.{model_name}).filter(models.{model_name}.id == {p0}).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="{model_name} not found")
    db.delete(db_item)
    db.commit()
    return {{"message": "Deleted successfully"}}"""
        else:
            body = "return {}"
            ret_type = "dict"

        fn_name = f"handle_{r.method.lower()}_{abs(hash(path)) % 1000}"
        route_blocks.append(f'''@router.{verb}("{path}"{sc_kwarg}, response_model={ret_type})
def {fn_name}({params_str}):
    {body}

''')

    return "routes.py", header + "".join(route_blocks)


def _database_py() -> Tuple[str, str]:
    content = '''"""Database setup - SQLite by default, easily switchable to PostgreSQL."""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
'''
    return "database.py", content


def _dockerfile() -> Tuple[str, str]:
    content = """FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
"""
    return "Dockerfile", content
