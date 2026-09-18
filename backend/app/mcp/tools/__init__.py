from app.mcp.tools.analysis import analyze_repository, parse_code, build_dependency_graph, inspect_git_history
from app.mcp.tools.execution import start_original_app, trace_runtime, run_tests, compare_behavior
from app.mcp.tools.migration import create_migration_plan, generate_file, modify_file, build_project
from app.mcp.tools.repair import analyze_failure, apply_fix, security_scan, modernize_project

__all__ = [
    "analyze_repository", "parse_code", "build_dependency_graph", "inspect_git_history",
    "start_original_app", "trace_runtime", "run_tests", "compare_behavior",
    "create_migration_plan", "generate_file", "modify_file", "build_project",
    "analyze_failure", "apply_fix", "security_scan", "modernize_project"
]
