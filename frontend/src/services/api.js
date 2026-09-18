const API_BASE = '/api';

export const api = {
  // Health
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // MCP Tools
  getMcpTools: async () => {
    const res = await fetch(`${API_BASE}/mcp/tools`);
    return res.json();
  },

  // Projects
  getProjects: async () => {
    const res = await fetch(`${API_BASE}/projects`);
    return res.json();
  },

  getProject: async (projectId) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}`);
    return res.json();
  },

  loadSampleProject: async () => {
    const res = await fetch(`${API_BASE}/projects/sample`, { method: 'POST' });
    return res.json();
  },

  loadPythonSampleProject: async () => {
    const res = await fetch(`${API_BASE}/projects/sample-python`, { method: 'POST' });
    return res.json();
  },

  getTargets: async () => {
    const res = await fetch(`${API_BASE}/projects/targets`);
    return res.json();
  },

  uploadZip: async (file, name, targetFramework = 'spring_boot') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('target_framework', targetFramework);
    const res = await fetch(`${API_BASE}/projects/upload`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  getProjectEvents: async (projectId) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/events`);
    return res.json();
  },

  getProjectGraph: async (projectId) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/graph`);
    return res.json();
  },

  // Codebase Chat
  sendChatMessage: async (projectId, message) => {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, message }),
    });
    return res.json();
  },

  // Migration
  getMigrationPlan: async (projectId) => {
    const res = await fetch(`${API_BASE}/migration/${projectId}/plan`);
    return res.json();
  },

  executeMigration: async (projectId, targetFramework = 'spring_boot', upgrades = ['docker', 'openapi', 'redis']) => {
    const res = await fetch(`${API_BASE}/migration/${projectId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_framework: targetFramework, modernization_upgrades: upgrades }),
    });
    return res.json();
  },

  getGeneratedFiles: async (projectId) => {
    const res = await fetch(`${API_BASE}/migration/${projectId}/files`);
    return res.json();
  },

  getSemanticDiff: async (projectId) => {
    const res = await fetch(`${API_BASE}/migration/${projectId}/diff`);
    return res.json();
  },

  // Verification & Repair
  triggerVerification: async (projectId) => {
    const res = await fetch(`${API_BASE}/verification/${projectId}/run`, { method: 'POST' });
    return res.json();
  },

  triggerRepair: async (projectId) => {
    const res = await fetch(`${API_BASE}/verification/${projectId}/repair`, { method: 'POST' });
    return res.json();
  },

  getVerificationRuns: async (projectId) => {
    const res = await fetch(`${API_BASE}/verification/${projectId}/runs`);
    return res.json();
  },
};
