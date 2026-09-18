from typing import TypedDict, List, Dict, Any, Optional

class AgentLogEntry(TypedDict):
    category: str      # 'EVIDENCE' | 'ANALYSIS' | 'HYPOTHESIS'
    agent: str         # 'ArchaeologistAgent' | 'PlannerAgent' | 'MigrationAgent' | 'VerificationAgent' | 'RepairAgent' | 'ModernizationAgent'
    title: str
    details: str
    metadata: Optional[Dict[str, Any]]
    timestamp: str

class ReForgeState(TypedDict):
    project_id: str
    project_name: str
    status: str
    events: List[Dict[str, Any]]
    ast_catalog: Dict[str, Any]
    knowledge_graph: Dict[str, Any]
    migration_plan: Dict[str, Any]
    generated_files: List[Dict[str, Any]]
    verification_results: Dict[str, Any]
    repair_attempts: int
    max_repairs: int
    needs_repair: bool
    modernization_options: List[str]
    error: Optional[str]
