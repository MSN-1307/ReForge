import React, { useState, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { Cpu, FileCode2, ArrowRightLeft, Layers } from 'lucide-react';
import { api } from '../services/api';

export default function MigrationDiffViewer({ projectId }) {
  const [pairs, setPairs] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadDiffs();
    }
  }, [projectId]);

  const loadDiffs = async () => {
    setLoading(true);
    try {
      const res = await api.getSemanticDiff(projectId);
      setPairs(res.pairs || []);
    } catch (err) {
      console.error('Failed to load semantic diffs:', err);
    } finally {
      setLoading(false);
    }
  };

  const activePair = pairs[activeIdx];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#090d16] text-slate-200">
      {/* Top Header & Selector */}
      <div className="p-4 bg-[#0f172a] border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-teal-400" />
          <h2 className="font-bold text-white text-sm">Monaco Semantic Migration Diff Viewer</h2>
        </div>

        {/* Diff Pair Switcher Tabs */}
        {pairs.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto">
            {pairs.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeIdx === idx
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5 text-teal-400" />
                <span>{p.title.split(':')[0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Subheader: File Mapping Path */}
      {activePair && (
        <div className="px-6 py-2.5 bg-[#121826] border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-slate-400">Source:</span>
            <code className="text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {activePair.source_path} ({activePair.source_lang})
            </code>
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-400">Target:</span>
            <code className="text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {activePair.target_path} ({activePair.target_lang})
            </code>
          </div>

          <span className="text-[11px] text-slate-500">{activePair.title}</span>
        </div>
      )}

      {/* Monaco Diff Editor Container */}
      <div className="flex-1 w-full h-full relative">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            <span className="animate-pulse">Loading semantic diff comparisons...</span>
          </div>
        ) : activePair ? (
          <DiffEditor
            height="100%"
            original={activePair.source_code}
            modified={activePair.target_code}
            language={activePair.target_lang}
            theme="vs-dark"
            options={{
              readOnly: true,
              renderSideBySide: true,
              fontSize: 12,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Cpu className="w-10 h-10 opacity-30 text-teal-400" />
            <p className="text-sm">No target files generated yet.</p>
            <p className="text-xs text-slate-600">
              Trigger "Run Autonomous Migration" to generate Spring Boot code and view semantic diffs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
