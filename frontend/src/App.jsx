import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MigrationPipeline from './components/MigrationPipeline';
import LanguageSelector from './components/LanguageSelector';
import AgentActivityConsole from './components/AgentActivityConsole';
import ArchitectureGraph from './components/ArchitectureGraph';
import CodebaseChat from './components/CodebaseChat';
import MigrationDiffViewer from './components/MigrationDiffViewer';
import OutputFileTree from './components/OutputFileTree';
import VerificationRunner from './components/VerificationRunner';
import ModernizationCenter from './components/ModernizationCenter';
import UploadModal from './components/UploadModal';
import { api } from './services/api';

export default function App() {
  const [currentProject, setCurrentProject] = useState(null);
  const [activeTab, setActiveTab] = useState('console'); // console, graph, chat, output, diff, verify, modernize
  const [targetFramework, setTargetFramework] = useState('spring_boot');
  const [events, setEvents] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
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
    if (proj.target_framework) {
      const tf = proj.target_framework.toLowerCase();
      if (tf.includes('fastapi')) setTargetFramework('fastapi');
      else if (tf.includes('flask')) setTargetFramework('flask');
      else if (tf.includes('gin') || tf.includes('go')) setTargetFramework('gin');
      else if (tf.includes('express') || tf.includes('node')) setTargetFramework('express');
      else setTargetFramework('spring_boot');
    }
    await refreshProjectData(proj.id);
  };

  const refreshProjectData = async (projectId) => {
    try {
      const evRes = await api.getProjectEvents(projectId);
      setEvents(evRes.events || []);

      const grRes = await api.getProjectGraph(projectId);
      setGraphData(grRes);

      const filesRes = await api.getGeneratedFiles(projectId);
      setGeneratedFiles(filesRes.files || []);
      if (filesRes.files && filesRes.files.length > 0 && !selectedFile) {
        setSelectedFile(filesRes.files[0].rel_path);
      }
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

        if (projRes.status === 'COMPLETED' || projRes.status.startsWith('FAILED') || projRes.status === 'MIGRATED') {
          setIsMigrating(false);
          const grRes = await api.getProjectGraph(currentProject.id);
          setGraphData(grRes);
          const filesRes = await api.getGeneratedFiles(currentProject.id);
          setGeneratedFiles(filesRes.files || []);
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
      await api.executeMigration(currentProject.id, targetFramework, ['docker', 'openapi', 'redis']);
    } catch (err) {
      console.error('Failed to trigger migration:', err);
      setIsMigrating(false);
    }
  };

  const handleProjectLoaded = async (loaded) => {
    const proj = await api.getProject(loaded.project_id);
    selectProject(proj);
  };

  const handleSelectTarget = (targetId) => {
    setTargetFramework(targetId);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      <Navbar
        currentProject={currentProject}
        onOpenUpload={() => setIsUploadOpen(true)}
        onRunMigration={handleRunMigration}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMigrating={isMigrating}
        targetFramework={targetFramework}
      />

      {/* Migration Progress Pipeline Stepper */}
      <MigrationPipeline
        status={currentProject?.status || "INITIALIZED"}
        isMigrating={isMigrating}
      />

      {/* Universal Target Selector Banner */}
      <div className="px-6 pt-4">
        <LanguageSelector
          selectedTarget={targetFramework}
          onSelectTarget={handleSelectTarget}
          currentSource={currentProject?.source_framework || "JavaScript / Express"}
        />
      </div>

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
        {activeTab === 'output' && (
          <OutputFileTree
            files={generatedFiles}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            projectId={currentProject?.id}
            targetFramework={targetFramework}
          />
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
        currentTarget={targetFramework}
        onChangeTarget={setTargetFramework}
      />
    </div>
  );
}
