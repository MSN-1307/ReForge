"""
Universal Migration Mapper for ReForge V2.
Orchestrates conversion from any source framework to any target framework.
"""
from typing import List, Tuple, Dict, Any
from pathlib import Path
from app.parser.universal_parser import UniversalProject, universal_parser
from app.mapping.generators.java_spring import generate_spring_boot
from app.mapping.generators.python_fastapi import generate_fastapi
from app.mapping.generators.python_flask import generate_flask
from app.mapping.generators.go_gin import generate_go_gin
from app.mapping.generators.node_express import generate_node_express

TARGET_FRAMEWORKS = {
    "spring_boot": {
        "name": "Java Spring Boot 3",
        "language": "java",
        "extension": ".java",
        "build_tool": "maven",
        "generator": generate_spring_boot
    },
    "fastapi": {
        "name": "Python FastAPI",
        "language": "python",
        "extension": ".py",
        "build_tool": "pip",
        "generator": generate_fastapi
    },
    "flask": {
        "name": "Python Flask",
        "language": "python",
        "extension": ".py",
        "build_tool": "pip",
        "generator": generate_flask
    },
    "gin": {
        "name": "Go Gin",
        "language": "go",
        "extension": ".go",
        "build_tool": "go mod",
        "generator": generate_go_gin
    },
    "express": {
        "name": "Node.js Express",
        "language": "javascript",
        "extension": ".js",
        "build_tool": "npm",
        "generator": generate_node_express
    }
}

class UniversalMapper:
    """Dispatches code generation to the appropriate target framework generator."""

    def normalize_target(self, target: str) -> str:
        t = target.lower().replace("-", "_").replace(" ", "_")
        if "spring" in t or "java" in t:
            return "spring_boot"
        elif "fastapi" in t:
            return "fastapi"
        elif "flask" in t:
            return "flask"
        elif "gin" in t or "go" in t:
            return "gin"
        elif "express" in t or "node" in t or "javascript" in t or "js" in t:
            return "express"
        return "spring_boot"

    def generate_project(
        self,
        project: UniversalProject,
        target_framework: str = "spring_boot",
        upgrades: List[str] = None
    ) -> Tuple[str, List[Tuple[str, str]]]:
        """
        Generates target project files.
        Returns (normalized_target_key, [(relative_path, content), ...])
        """
        target_key = self.normalize_target(target_framework)
        meta = TARGET_FRAMEWORKS.get(target_key, TARGET_FRAMEWORKS["spring_boot"])
        generator = meta["generator"]

        files = generator(project, upgrades=upgrades or [])
        return target_key, files

    def list_supported_targets(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": k,
                "name": v["name"],
                "language": v["language"],
                "build_tool": v["build_tool"]
            }
            for k, v in TARGET_FRAMEWORKS.items()
        ]

universal_mapper = UniversalMapper()
