from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import projects, chat, migration, verification, ws
from app.mcp.registry import mcp_registry
import app.mcp.tools  # Register all MCP tools

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="ReForge: Autonomous Software Migration and Modernization Platform"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(projects.router)
app.include_router(chat.router)
app.include_router(migration.router)
app.include_router(verification.router)
app.include_router(ws.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.version,
        "llm_provider": settings.llm_provider
    }

@app.get("/api/mcp/tools")
def list_mcp_tools():
    """Returns the list of all controlled deterministic MCP tools available to agents."""
    return {"tools": mcp_registry.list_tools()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
