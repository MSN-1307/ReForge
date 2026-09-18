import networkx as nx
from pathlib import Path
from typing import Dict, Any, List
from app.parser.ast_engine import ast_parser

class CodebaseKnowledgeGraph:
    """
    In-memory Knowledge Graph constructed using NetworkX.
    Represents files, endpoints, models, middleware, and architectural relationships.
    Provides conversion to React Flow format for interactive UI visualization.
    """
    def __init__(self, project_path: Path):
        self.project_path = project_path
        self.graph = nx.DiGraph()

    def build_from_ast(self, ast_catalog: Dict[str, Any]):
        """
        Builds graph from analyzed AST catalog.
        """
        self.graph.clear()
        
        # Add root project node
        root_id = "project_root"
        self.graph.add_node(root_id, label="Source Codebase", node_type="root", path=str(self.project_path))

        for file_rel_path, file_data in ast_catalog.items():
            file_id = f"file::{file_rel_path}"
            self.graph.add_node(
                file_id,
                label=Path(file_rel_path).name,
                node_type="file",
                rel_path=file_rel_path,
                lines=file_data.get("lines_count", 0)
            )
            self.graph.add_edge(root_id, file_id, relation="CONTAINS")

            # Add Models
            for model in file_data.get("models", []):
                model_name = model.get("name")
                model_id = f"model::{model_name}"
                self.graph.add_node(
                    model_id,
                    label=f"Entity: {model_name}",
                    node_type="model",
                    fields=model.get("fields", {}),
                    file=file_rel_path
                )
                self.graph.add_edge(file_id, model_id, relation="DEFINES_MODEL")

            # Add Routes / Endpoints
            for route in file_data.get("routes", []):
                route_id = f"route::{route.get('method')}::{route.get('path')}"
                label = f"{route.get('method')} {route.get('path')}"
                self.graph.add_node(
                    route_id,
                    label=label,
                    node_type="route",
                    method=route.get("method"),
                    path=route.get("path"),
                    line=route.get("line"),
                    file=file_rel_path,
                    body_fields=route.get("body_fields", []),
                    status_code=route.get("status_code", 200)
                )
                self.graph.add_edge(file_id, route_id, relation="EXPOSES_ROUTE")

                # Edge from route to model if route uses model
                for model in file_data.get("models", []):
                    model_name = model.get("name")
                    model_id = f"model::{model_name}"
                    self.graph.add_edge(route_id, model_id, relation="QUERIES")

            # Add Middleware
            for mw in file_data.get("middleware", []):
                mw_id = f"middleware::{mw.get('name')}"
                self.graph.add_node(
                    mw_id,
                    label=f"Middleware: {mw.get('name')}",
                    node_type="middleware",
                    line=mw.get("line"),
                    file=file_rel_path
                )
                self.graph.add_edge(file_id, mw_id, relation="APPLIES_MIDDLEWARE")

    def to_react_flow(self) -> Dict[str, Any]:
        """
        Converts the NetworkX knowledge graph into React Flow compatible nodes & edges.
        Calculates automatic grid positions for clear visual layout.
        """
        nodes = []
        edges = []

        # Color mapping for node types
        color_map = {
            "root": "#3b82f6",       # Blue
            "file": "#64748b",       # Slate
            "route": "#10b981",      # Emerald Green
            "model": "#f59e0b",      # Amber
            "middleware": "#8b5cf6"  # Purple
        }

        # Organize by layer
        layer_order = {"root": 0, "file": 1, "route": 2, "model": 3, "middleware": 2}
        layer_items = {0: [], 1: [], 2: [], 3: []}

        for node_id, data in self.graph.nodes(data=True):
            ntype = data.get("node_type", "file")
            layer = layer_order.get(ntype, 1)
            layer_items[layer].append((node_id, data))

        # Position assignment
        for layer_idx, items in layer_items.items():
            x = 50 + (layer_idx * 300)
            for item_idx, (node_id, data) in enumerate(items):
                y = 80 + (item_idx * 110)
                ntype = data.get("node_type", "file")
                nodes.append({
                    "id": node_id,
                    "type": "default",
                    "position": {"x": x, "y": y},
                    "data": {
                        "label": data.get("label", node_id),
                        "nodeType": ntype,
                        "details": {k: v for k, v in data.items() if k not in ["label", "node_type"]}
                    },
                    "style": {
                        "background": "#1e293b",
                        "color": "#f8fafc",
                        "border": f"2px solid {color_map.get(ntype, '#64748b')}",
                        "borderRadius": "8px",
                        "padding": "10px 14px",
                        "fontSize": "12px",
                        "fontWeight": "600",
                        "boxShadow": "0 4px 6px -1px rgba(0, 0, 0, 0.4)"
                    }
                })

        for u, v, data in self.graph.edges(data=True):
            edges.append({
                "id": f"e-{u}->{v}",
                "source": u,
                "target": v,
                "label": data.get("relation", ""),
                "animated": data.get("relation") in ["EXPOSES_ROUTE", "QUERIES"],
                "style": {"stroke": "#64748b", "strokeWidth": 1.5},
                "labelStyle": {"fill": "#94a3b8", "fontSize": 10, "fontWeight": 500}
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "summary": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "route_count": len([n for n in nodes if n["data"]["nodeType"] == "route"]),
                "model_count": len([n for n in nodes if n["data"]["nodeType"] == "model"])
            }
        }
