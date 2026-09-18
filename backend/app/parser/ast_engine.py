import re
import json
from pathlib import Path
from typing import Dict, Any, List, Optional

class ASTNode(dict):
    """Normalized AST Node Representation."""
    def __init__(self, node_type: str, name: str, line_number: int, properties: Optional[Dict[str, Any]] = None):
        super().__init__(type=node_type, name=name, line=line_number, properties=properties or {})

class CodebaseASTParser:
    """
    AST Analysis Engine for JavaScript / TypeScript and Node.js / Express codebases.
    Extracts routes, controllers, middleware, Mongoose schemas/models, imports, and exports.
    """
    def __init__(self):
        # HTTP Methods in Express
        self.http_methods = ["get", "post", "put", "delete", "patch", "options", "head"]

    def parse_file(self, file_path: Path) -> Dict[str, Any]:
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        content = file_path.read_text(encoding="utf-8", errors="replace")
        lines = content.splitlines()

        ast_data = {
            "file": str(file_path),
            "lines_count": len(lines),
            "imports": self._extract_imports(lines),
            "routes": self._extract_routes(lines),
            "models": self._extract_mongoose_models(lines, content),
            "middleware": self._extract_middleware(lines),
            "exports": self._extract_exports(lines)
        }
        return ast_data

    def _extract_imports(self, lines: List[str]) -> List[Dict[str, Any]]:
        imports = []
        # Match require: const/let/var x = require('...')
        require_regex = re.compile(r'(?:const|let|var)\s+(\{?[a-zA-Z0-9_,\s]+\}?)\s*=\s*require\([\'"]([^\'"]+)[\'"]\)')
        # Match ES import: import ... from '...'
        import_regex = re.compile(r'import\s+(?:(\* as \w+|\{[^}]+\}|\w+))\s+from\s+[\'"]([^\'"]+)[\'"]')

        for idx, line in enumerate(lines, 1):
            req_match = require_regex.search(line)
            if req_match:
                imported_symbols = [s.strip() for s in req_match.group(1).replace('{', '').replace('}', '').split(',') if s.strip()]
                imports.append({
                    "type": "require",
                    "symbols": imported_symbols,
                    "source": req_match.group(2),
                    "line": idx
                })
                continue
            
            es_match = import_regex.search(line)
            if es_match:
                imports.append({
                    "type": "es_import",
                    "symbols": [es_match.group(1).strip()],
                    "source": es_match.group(2),
                    "line": idx
                })
        return imports

    def _extract_routes(self, lines: List[str]) -> List[Dict[str, Any]]:
        routes = []
        # e.g.: router.get('/api/books', authMiddleware, async (req, res) => { ... })
        # e.g.: app.post('/api/books/:id', (req, res) => { ... })
        method_pattern = "|".join(self.http_methods)
        route_regex = re.compile(rf'(?:app|router)\.({method_pattern})\s*\(\s*[\'"]([^\'"]+)[\'"]\s*,\s*(.*?)(?:=>|function|\(req|\()')

        for idx, line in enumerate(lines, 1):
            match = route_regex.search(line)
            if match:
                method = match.group(1).upper()
                path = match.group(2)
                middleware_str = match.group(3).strip()
                
                # Check for path params e.g. /:id or /:bookId
                path_params = re.findall(r':([a-zA-Z0-9_]+)', path)
                
                # Look ahead a few lines to inspect req.body and res.status/res.json
                body_fields = []
                status_code = 200
                response_type = "json"

                lookahead = "\n".join(lines[idx-1:min(idx+35, len(lines))])
                # Find body destructuring: const { title, author, price } = req.body
                body_destructure = re.findall(r'(?:const|let|var)\s+\{([^}]+)\}\s*=\s*req\.body', lookahead)
                for bd in body_destructure:
                    body_fields.extend([f.strip() for f in bd.split(',') if f.strip()])

                # Direct body accesses: req.body.title
                direct_body = re.findall(r'req\.body\.([a-zA-Z0-9_]+)', lookahead)
                body_fields.extend(direct_body)
                body_fields = list(dict.fromkeys(body_fields))

                # Check for explicit status code: res.status(201)
                status_match = re.search(r'res\.status\((\d{3})\)', lookahead)
                if status_match:
                    status_code = int(status_match.group(1))
                elif method == "POST":
                    status_code = 201

                routes.append({
                    "method": method,
                    "path": path,
                    "line": idx,
                    "path_params": path_params,
                    "body_fields": body_fields,
                    "status_code": status_code,
                    "response_type": response_type,
                    "middleware": [m.strip() for m in middleware_str.split(',') if m.strip() and not m.startswith('async') and not m.startswith('(')]
                })
        return routes

    def _extract_mongoose_models(self, lines: List[str], full_content: str) -> List[Dict[str, Any]]:
        models = []
        # Pattern: const BookSchema = new (mongoose.)Schema({ ... })
        schema_pattern = re.compile(r'(?:const|let|var)\s+(\w+)\s*=\s*new\s+(?:mongoose\.)?Schema\s*\(\s*\{([\s\S]*?)\}\s*(?:,\s*\{[\s\S]*?\})?\s*\)', re.MULTILINE)
        model_pattern = re.compile(r'(?:mongoose\.)?model\s*\(\s*[\'"](\w+)[\'"]\s*,\s*(\w+)\s*\)')

        schema_fields_map = {}
        for match in schema_pattern.finditer(full_content):
            schema_var = match.group(1)
            raw_fields = match.group(2)
            fields = {}

            # Parse simple fields: title: { type: String, required: true }, or price: Number
            for field_match in re.finditer(r'(\w+)\s*:\s*(?:\{\s*type\s*:\s*(\w+)(?:[^}]*required\s*:\s*(true|false))?[^}]*\}|(\w+))', raw_fields):
                field_name = field_match.group(1)
                field_type = field_match.group(2) or field_match.group(4) or "String"
                is_required = field_match.group(3) == "true"
                fields[field_name] = {
                    "type": field_type,
                    "required": is_required
                }
            schema_fields_map[schema_var] = fields

        # Match mongoose.model('Book', BookSchema)
        for match in model_pattern.finditer(full_content):
            model_name = match.group(1)
            schema_var = match.group(2)
            models.append({
                "name": model_name,
                "schema_var": schema_var,
                "fields": schema_fields_map.get(schema_var, {})
            })

        # Fallback if model defined in inline export: module.exports = mongoose.model('Book', ...)
        return models

    def _extract_middleware(self, lines: List[str]) -> List[Dict[str, Any]]:
        middleware = []
        # Pattern: app.use(...) or function authMiddleware(req, res, next)
        mw_fn_pattern = re.compile(r'(?:const|let|var|function)\s+(\w+)\s*(?:=\s*(?:async\s*)?\([^)]*next[^)]*\)|=\s*function\s*\([^)]*next|\([^)]*next[^)]*\))')
        app_use_pattern = re.compile(r'app\.use\s*\(\s*([^)]+)\s*\)')

        for idx, line in enumerate(lines, 1):
            fn_match = mw_fn_pattern.search(line)
            if fn_match:
                middleware.append({
                    "name": fn_match.group(1),
                    "type": "custom_function",
                    "line": idx
                })
            use_match = app_use_pattern.search(line)
            if use_match:
                middleware.append({
                    "name": use_match.group(1).strip(),
                    "type": "app_use",
                    "line": idx
                })
        return middleware

    def _extract_exports(self, lines: List[str]) -> List[Dict[str, Any]]:
        exports = []
        for idx, line in enumerate(lines, 1):
            if "module.exports" in line or "export default" in line:
                exports.append({
                    "statement": line.strip(),
                    "line": idx
                })
        return exports

ast_parser = CodebaseASTParser()
