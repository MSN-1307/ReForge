from typing import Callable, Dict, Any, List
import inspect
import logging

logger = logging.getLogger("reforge.mcp")

class MCPToolRegistry:
    """
    Model Context Protocol (MCP) Tool Registry.
    Provides deterministic, controlled access to execution and analysis capabilities.
    Prevents unconstrained system access by agents.
    """
    def __init__(self):
        self._tools: Dict[str, Callable] = {}
        self._tool_metadata: Dict[str, Dict[str, Any]] = {}

    def register(self, name: str, category: str, description: str):
        def decorator(func: Callable):
            sig = inspect.signature(func)
            parameters = {}
            for param_name, param in sig.parameters.items():
                parameters[param_name] = {
                    "type": str(param.annotation) if param.annotation != inspect.Parameter.empty else "str",
                    "default": None if param.default == inspect.Parameter.empty else param.default
                }
            self._tools[name] = func
            self._tool_metadata[name] = {
                "name": name,
                "category": category,
                "description": description,
                "parameters": parameters,
                "returns": str(sig.return_annotation) if sig.return_annotation != inspect.Signature.empty else "Any"
            }
            return func
        return decorator

    def execute(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        if tool_name not in self._tools:
            raise ValueError(f"MCP Tool '{tool_name}' is not registered or allowed.")
        logger.info(f"Executing MCP Tool: {tool_name} with args: {list(kwargs.keys())}")
        try:
            result = self._tools[tool_name](**kwargs)
            return {
                "success": True,
                "tool": tool_name,
                "result": result,
                "error": None
            }
        except Exception as e:
            logger.error(f"Error executing MCP tool {tool_name}: {str(e)}", exc_info=True)
            return {
                "success": False,
                "tool": tool_name,
                "result": None,
                "error": str(e)
            }

    def list_tools(self, category: str = None) -> List[Dict[str, Any]]:
        tools = list(self._tool_metadata.values())
        if category:
            tools = [t for t in tools if t["category"].lower() == category.lower()]
        return tools

# Singleton registry instance
mcp_registry = MCPToolRegistry()
