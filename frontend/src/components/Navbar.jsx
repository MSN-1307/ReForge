import { Layers, Terminal, Cpu, Sparkles, RefreshCw, Upload, Play, Download, FileCode2, ArrowRight } from 'lucide-react';

export default function Navbar({
  currentProject,
  onOpenUpload,
  onRunMigration,
  activeTab,
  setActiveTab,
  isMigrating,
  targetFramework
}) {
  const tabs = [
    { id: 'console', label: 'Agent Console', icon: Terminal },
    { id: 'graph', label: 'Architecture Graph', icon: Layers },
    { id: 'chat', label: 'Codebase Chat', icon: Sparkles },
    { id: 'output', label: 'Generated Code', icon: FileCode2 },
    { id: 'diff', label: 'Semantic Diff', icon: Cpu },
    { id: 'verify', label: 'Verification & Repair', icon: RefreshCw },
    { id: 'modernize', label: 'Modernization', icon: Sparkles }
  ];

  const getTargetName = () => {
    const tf = (currentProject?.target_framework || targetFramework || "spring_boot").toLowerCase();
    if (tf.includes("spring") || tf.includes("java")) return "Spring Boot";
    if (tf.includes("fastapi")) return "FastAPI";
    if (tf.includes("flask")) return "Flask";
    if (tf.includes("gin") || tf.includes("go")) return "Go Gin";
    if (tf.includes("express") || tf.includes("node")) return "Express";
    return "Target";
  };

  return (
    <header className="bg-[#0f172a] border-b border-slate-800 px-6 py-3 sticky top-0 z-50 shadow-md">
      <div className="flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <span className="font-extrabold text-white text-base tracking-tighter">RF</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base text-white tracking-tight">ReForge</h1>
              <span className="px-2 py-0.5 text-[9px] font-bold bg-teal-500/10 text-teal-400 rounded-full border border-teal-500/30">
                UNIVERSAL v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Autonomous Any-to-Any Software Modernization</p>
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
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm font-semibold'
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
        <div className="flex items-center space-x-2.5">
          {currentProject ? (
            <div className="flex items-center space-x-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-200 font-semibold max-w-[130px] truncate">
                {currentProject.name}
              </span>
              <span className="flex items-center space-x-1 text-[10px] text-teal-300 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/30 font-mono">
                <span>{currentProject.source_framework.split('/')[0].trim()}</span>
                <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                <span className="font-bold">{getTargetName()}</span>
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">No Project Loaded</span>
          )}

          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Ingest</span>
          </button>

          {currentProject && (currentProject.status === 'COMPLETED' || currentProject.status === 'MIGRATED') && (
            <a
              href={`/api/migration/${currentProject.id}/download`}
              download
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-emerald-500/20 transition"
              title={`Download generated ${getTargetName()} project as .zip`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP</span>
            </a>
          )}

          <button
            onClick={onRunMigration}
            disabled={!currentProject || isMigrating}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition ${
              !currentProject || isMigrating
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-500/20 hover:scale-[1.02]'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isMigrating ? 'animate-spin' : ''}`} />
            <span>{isMigrating ? 'Orchestrating...' : 'Migrate'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
