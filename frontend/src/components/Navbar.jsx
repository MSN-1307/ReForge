import React from 'react';
import { Layers, Terminal, Cpu, Sparkles, RefreshCw, Upload, Play, Download } from 'lucide-react';

export default function Navbar({
  currentProject,
  onOpenUpload,
  onRunMigration,
  activeTab,
  setActiveTab,
  isMigrating
}) {
  const tabs = [
    { id: 'console', label: 'Agent Console', icon: Terminal },
    { id: 'graph', label: 'Architecture Graph', icon: Layers },
    { id: 'chat', label: 'Codebase Chat', icon: Sparkles },
    { id: 'diff', label: 'Semantic Diff', icon: Cpu },
    { id: 'verify', label: 'Verification & Repair', icon: RefreshCw },
    { id: 'modernize', label: 'Modernization', icon: Sparkles }
  ];

  return (
    <header className="bg-[#0f172a] border-b border-slate-800 px-6 py-3.5 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <span className="font-extrabold text-white text-xl tracking-tighter">RF</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg text-white tracking-tight">ReForge</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-teal-500/10 text-teal-400 rounded-full border border-teal-500/30">
                MVP v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Software Migration & Modernization</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Project & Action Buttons */}
        <div className="flex items-center space-x-3">
          {currentProject ? (
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-medium max-w-[140px] truncate">
                {currentProject.name}
              </span>
              <span className="text-slate-500 text-[10px]">
                ({currentProject.source_framework.split('/')[0]} → Java)
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">No Project Active</span>
          )}

          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Load / Ingest</span>
          </button>

          {currentProject && (currentProject.status === 'COMPLETED' || currentProject.status === 'MIGRATED') && (
            <a
              href={`/api/migration/${currentProject.id}/download`}
              download
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-emerald-500/20 transition"
              title="Download full Spring Boot project as .zip"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Java ZIP</span>
            </a>
          )}

          <button
            onClick={onRunMigration}
            disabled={!currentProject || isMigrating}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md transition ${
              !currentProject || isMigrating
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-500/20 hover:scale-[1.02]'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isMigrating ? 'animate-spin' : ''}`} />
            <span>{isMigrating ? 'Agents Running...' : 'Run Autonomous Migration'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
