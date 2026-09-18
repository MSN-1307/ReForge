"""
Node.js Express code generator for ReForge V2 Universal Mapper.
Generates an Express + Mongoose (or in-memory) REST API from UniversalProject.
"""
from typing import List, Tuple
from app.parser.universal_parser import UniversalProject, UniversalRoute, UniversalModel

def generate_node_express(project: UniversalProject, upgrades: List[str] = None) -> List[Tuple[str, str]]:
    upgrades = upgrades or []
    files = [
        _package_json(project),
        _server_js(project),
        _routes_js(project.routes, project.models),
    ]
    for m in project.models:
        files.append(_model_js(m))
    if "docker" in upgrades:
        files.append(_dockerfile())
    return files

def _package_json(project: UniversalProject) -> Tuple[str, str]:
    art_id = project.name.lower().replace(" ", "-")
    content = f"""{{
  "name": "{art_id}",
  "version": "1.0.0",
  "description": "Migrated from {project.source_language}/{project.source_framework} by ReForge",
  "main": "server.js",
  "scripts": {{
    "start": "node server.js",
    "dev": "nodemon server.js"
  }},
  "dependencies": {{
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5"
  }},
  "devDependencies": {{
    "nodemon": "^3.1.0"
  }}
}}
"""
    return "package.json", content

def _server_js(project: UniversalProject) -> Tuple[str, str]:
    content = f"""/**
 * Express Server migrated from {project.source_language}/{project.source_framework} by ReForge
 */
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {{
  console.log(`[${{new Date().toISOString()}}] ${{req.method}} ${{req.url}}`);
  next();
}});

// Health check
app.get('/health', (req, res) => {{
  res.json({{ status: 'UP', service: '{project.name}' }});
}});

// API routes
app.use('/api', apiRoutes);

app.listen(PORT, () => {{
  console.log(`Server running on http://localhost:${{PORT}}`);
}});

module.exports = app;
"""
    return "server.js", content

def _model_js(model: UniversalModel) -> Tuple[str, str]:
    fields_code = []
    for f in model.fields:
        if f.name.lower() in ("id", "_id"):
            continue
        js_type = {"String": "String", "Integer": "Number", "Float": "Number", "Boolean": "Boolean", "DateTime": "Date"}.get(f.type, "String")
        req = "true" if f.required else "false"
        fields_code.append(f"  {f.name}: {{ type: {js_type}, required: {req} }}")

    content = f"""/**
 * In-memory Data Model for {model.name}
 * Migrated from {model.file} by ReForge
 */
class {model.name}Store {{
  constructor() {{
    this.items = [];
    this.currentId = 1;
  }}

  findAll() {{
    return this.items;
  }}

  findById(id) {{
    return this.items.find(item => item.id === Number(id));
  }}

  create(data) {{
    const item = {{ id: this.currentId++, ...data, createdAt: new Date() }};
    this.items.push(item);
    return item;
  }}

  update(id, data) {{
    const idx = this.items.findIndex(item => item.id === Number(id));
    if (idx === -1) return null;
    this.items[idx] = {{ ...this.items[idx], ...data, updatedAt: new Date() }};
    return this.items[idx];
  }}

  delete(id) {{
    const idx = this.items.findIndex(item => item.id === Number(id));
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    return true;
  }}
}}

module.exports = new {model.name}Store();
"""
    return f"models/{model.name}.js", content

def _routes_js(routes: List[UniversalRoute], models: List[UniversalModel]) -> Tuple[str, str]:
    model_name = models[0].name if models else "Item"
    routes_code = []
    method_map = {"GET": "get", "POST": "post", "PUT": "put", "DELETE": "delete", "PATCH": "patch"}

    for idx, r in enumerate(routes):
        m = method_map.get(r.method, "get")
        # Express path: convert {id} to :id
        express_path = r.path
        for p in r.path_params:
            express_path = express_path.replace(f"{{{p}}}", f":{p}")
        if express_path.startswith("/api"):
            express_path = express_path[4:] or "/"

        p0 = r.path_params[0] if r.path_params else "id"
        if r.method == "GET" and not r.path_params:
            body = f"  res.json({model_name}Store.findAll());"
        elif r.method == "GET":
            body = f"""  const item = {model_name}Store.findById(req.params.{p0});
  if (!item) return res.status(404).json({{ error: '{model_name} not found' }});
  res.json(item);"""
        elif r.method == "POST":
            body = f"""  const created = {model_name}Store.create(req.body);
  res.status(201).json(created);"""
        elif r.method in ("PUT", "PATCH"):
            body = f"""  const updated = {model_name}Store.update(req.params.{p0}, req.body);
  if (!updated) return res.status(404).json({{ error: '{model_name} not found' }});
  res.json(updated);"""
        elif r.method == "DELETE":
            body = f"""  const deleted = {model_name}Store.delete(req.params.{p0});
  if (!deleted) return res.status(404).json({{ error: '{model_name} not found' }});
  res.status(204).send();"""
        else:
            body = "  res.json({ message: 'Success' });"

        routes_code.append(f"""// {r.method} {r.path}
router.{m}('{express_path}', (req, res) => {{
{body}
}});
""")

    content = f"""const express = require('express');
const router = express.Router();
const {model_name}Store = require('../models/{model_name}');

{"".join(routes_code)}
module.exports = router;
"""
    return "routes/api.js", content

def _dockerfile() -> Tuple[str, str]:
    content = """FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
"""
    return "Dockerfile", content
