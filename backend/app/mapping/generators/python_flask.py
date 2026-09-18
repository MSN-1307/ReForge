"""
Python Flask code generator for ReForge V2 Universal Mapper.
"""
from typing import List, Tuple
from app.parser.universal_parser import UniversalProject, UniversalRoute, UniversalModel


def generate_flask(project: UniversalProject, upgrades: List[str] = None) -> List[Tuple[str, str]]:
    upgrades = upgrades or []
    files = [
        _requirements(upgrades),
        _app_py(project),
        _models_py(project.models),
        _routes_py(project.routes, project.models),
    ]
    if "docker" in upgrades:
        files.append(_dockerfile())
    return files


def _requirements(upgrades: List[str]) -> Tuple[str, str]:
    pkgs = ["flask>=3.0.0", "flask-sqlalchemy>=3.1.1", "flask-cors>=4.0.0"]
    if "redis" in upgrades:
        pkgs.append("flask-caching>=2.1.0\nredis>=5.0.0")
    return "requirements.txt", "\n".join(pkgs) + "\n"


def _app_py(project: UniversalProject) -> Tuple[str, str]:
    content = f'''"""Flask Application migrated by ReForge from {project.source_language}/{project.source_framework}"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from routes import bp

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app)
from models import db
db.init_app(app)

app.register_blueprint(bp)

with app.app_context():
    db.create_all()

@app.get("/health")
def health():
    return {{"status": "UP", "service": "{project.name}"}}

if __name__ == "__main__":
    app.run(debug=False, port=5000)
'''
    return "app.py", content


def _models_py(models: List[UniversalModel]) -> Tuple[str, str]:
    TYPE_MAP = {"String": "db.String(255)", "Integer": "db.Integer",
                "Float": "db.Float", "Boolean": "db.Boolean", "DateTime": "db.DateTime"}
    blocks = ["from flask_sqlalchemy import SQLAlchemy\nimport datetime\n\ndb = SQLAlchemy()\n\n"]
    for m in models:
        fields = ["    id = db.Column(db.Integer, primary_key=True)"]
        for f in m.fields:
            if f.name.lower() in ("id", "_id"):
                continue
            sa = TYPE_MAP.get(f.type, "db.String(255)")
            null = "nullable=False" if f.required else "nullable=True"
            fields.append(f"    {f.name} = db.Column({sa}, {null})")
        fields_str = "\n".join(fields)
        blocks.append(f'''class {m.name}(db.Model):
    __tablename__ = "{m.table_name}"
{fields_str}

    def to_dict(self):
        return {{c.name: getattr(self, c.name) for c in self.__table__.columns}}
''')
    return "models.py", "\n".join(blocks)


def _routes_py(routes: List[UniversalRoute], models: List[UniversalModel]) -> Tuple[str, str]:
    model_name = models[0].name if models else "Item"
    method_map = {"GET": "GET", "POST": "POST", "PUT": "PUT", "DELETE": "DELETE", "PATCH": "PATCH"}

    header = f"""from flask import Blueprint, request, jsonify
from models import db, {model_name}

bp = Blueprint('api', __name__)

"""
    route_blocks = []
    for r in routes:
        path = r.path.replace("{", "<int:").replace("}", ">")
        methods = f'["{r.method}"]'
        params_sig = ", ".join(r.path_params) if r.path_params else ""

        if r.method == "GET" and not r.path_params:
            body = f"items = {model_name}.query.all()\n    return jsonify([i.to_dict() for i in items])"
        elif r.method == "GET":
            p0 = r.path_params[0] if r.path_params else "id"
            body = f"""item = {model_name}.query.get_or_404({p0})
    return jsonify(item.to_dict())"""
        elif r.method == "POST":
            body = f"""data = request.get_json()
    item = {model_name}(**data)
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201"""
        elif r.method in ("PUT", "PATCH"):
            p0 = r.path_params[0] if r.path_params else "id"
            body = f"""item = {model_name}.query.get_or_404({p0})
    data = request.get_json()
    for k, v in data.items():
        setattr(item, k, v)
    db.session.commit()
    return jsonify(item.to_dict())"""
        elif r.method == "DELETE":
            p0 = r.path_params[0] if r.path_params else "id"
            body = f"""item = {model_name}.query.get_or_404({p0})
    db.session.delete(item)
    db.session.commit()
    return '', 204"""
        else:
            body = "return jsonify({})"

        fn_name = f"handle_{r.method.lower()}_{abs(hash(r.path)) % 1000}"
        route_blocks.append(f'''@bp.route("{r.path}", methods={methods})
def {fn_name}({params_sig}):
    {body}

''')

    return "routes.py", header + "".join(route_blocks)


def _dockerfile() -> Tuple[str, str]:
    content = """FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
"""
    return "Dockerfile", content
