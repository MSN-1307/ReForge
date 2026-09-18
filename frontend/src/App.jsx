import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AgentActivityConsole from './components/AgentActivityConsole';
import ArchitectureGraph from './components/ArchitectureGraph';
import CodebaseChat from './components/CodebaseChat';
import MigrationDiffViewer from './components/MigrationDiffViewer';
import VerificationRunner from './components/VerificationRunner';
import ModernizationCenter from './components/ModernizationCenter';
import UploadModal from './components/UploadModal';
import { api } from './services/api';

export default function App() {
  const [currentProject, setCurrentProject] = useState(null);
  const [activeTab, setActiveTab] = useState('console'); // console, graph, chat, diff, verify, modernize
  const [events, setEvents] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Initialize: load projects or auto-load sample
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      const res = await api.getProjects();
      if (res.projects && res.projects.length > 0) {
        selectProject(res.projects[0]);
      } else {
        // Auto-load bundled sample for zero-friction experience
        const sample = await api.loadSampleProject();
        if (sample.project_id) {
          const p = await api.getProject(sample.project_id);
          selectProject(p);
        }
      }
    } catch (err) {
      console.error('App init error:', err);
    }
  };

  const selectProject = async (proj) => {
    setCurrentProject(proj);
    await refreshProjectData(proj.id);
  };

  const refreshProjectData = async (projectId) => {
    try {
      const evRes = await api.getProjectEvents(projectId);
      setEvents(evRes.events || []);

      const grRes = await api.getProjectGraph(projectId);
      setGraphData(grRes);
    } catch (err) {
      console.error('Error refreshing project data:', err);
    }
  };

  // Poll for agent logs while migrating
  useEffect(() => {
    let interval = null;
    if (isMigrating && currentProject) {
      interval = setInterval(async () => {
        const evRes = await api.getProjectEvents(currentProject.id);
        setEvents(evRes.events || []);

        const projRes = await api.getProject(currentProject.id);
        setCurrentProject(projRes);

        if (projRes.status === 'COMPLETED' || projRes.status.startsWith('FAILED')) {
          setIsMigrating(false);
          const grRes = await api.getProjectGraph(currentProject.id);
          setGraphData(grRes);
        }
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMigrating, currentProject]);

  const handleRunMigration = async () => {
    if (!currentProject || isMigrating) return;
    setIsMigrating(true);
    setActiveTab('console');
    try {
      await api.executeMigration(currentProject.id, ['docker', 'openapi', 'redis']);
    } catch (err) {
      console.error('Failed to trigger migration:', err);
      setIsMigrating(false);
    }
  };

  const handleProjectLoaded = async (loaded) => {
    const proj = await api.getProject(loaded.project_id);
    selectProject(proj);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <Navbar
        currentProject={currentProject}
        onOpenUpload={() => setIsUploadOpen(true)}
        onRunMigration={handleRunMigration}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMigrating={isMigrating}
      />

      <main className="flex-1">
        {activeTab === 'console' && (
          <AgentActivityConsole events={events} isMigrating={isMigrating} />
        )}
        {activeTab === 'graph' && (
          <ArchitectureGraph graphData={graphData} />
        )}
        {activeTab === 'chat' && (
          <CodebaseChat projectId={currentProject?.id} />
        )}
        {activeTab === 'diff' && (
          <MigrationDiffViewer projectId={currentProject?.id} />
        )}
        {activeTab === 'verify' && (
          <VerificationRunner projectId={currentProject?.id} />
        )}
        {activeTab === 'modernize' && (
          <ModernizationCenter projectId={currentProject?.id} />
        )}
      </main>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onProjectLoaded={handleProjectLoaded}
      />
    </div>
  );
}
