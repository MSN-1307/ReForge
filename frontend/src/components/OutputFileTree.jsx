import React, { useState } from 'react';
import { FileCode, Folder, Download, Copy, Check, ExternalLink, Code2 } from 'lucide-react';

export default function OutputFileTree({ files = [], onSelectFile, selectedFile, projectId, targetFramework }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeFile = files.find(f => f.rel_path === selectedFile) || files[0];

  const getExtensionColor = (path) => {
    if (path.endsWith('.java')) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    if (path.endsWith('.py')) return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
    if (path.endsWith('.go')) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    if (path.endsWith('.js') || path.endsWith('.ts')) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    if (path.endsWith('.xml') || path.endsWith('.json')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    return 'text-slate-400 bg-slate-800 border-slate-700';
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-[#090d16] text-slate-200 border border-slate-800 rounded-xl overflow-hidden m-4">
      {/* File Tree Left Sidebar */}
      <div className="w-72 bg-[#0f172a] border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Folder className="w-4 h-4 text-teal-400" />
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Target Codebase</h3>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30">
            {files.length} Files
          </span>
        </div>

        {/* File Tree Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {files.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 italic">
              No files generated yet. Run migration to generate target code.
            </div>
          ) : (
            files.map((file, idx) => {
              const isSelected = activeFile?.rel_path === file.rel_path;
              const badgeClass = getExtensionColor(file.rel_path);

              return (
                <button
                  key={idx}
                  onClick={() => onSelectFile && onSelectFile(file.rel_path)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono text-left transition ${
                    isSelected
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-teal-400' : 'text-slate-500'}`} />
                    <span className="truncate">{file.rel_path}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 ml-1">
                    {file.lines}L
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Bottom Download ZIP Action */}
        {projectId && files.length > 0 && (
          <div className="p-3 border-t border-slate-800 bg-[#090d16]">
            <a
              href={`/api/migration/${projectId}/download`}
              download
              className="w-full flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-500 text-white py-2 px-3 rounded-lg text-xs font-semibold shadow-md shadow-teal-500/20 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Project ZIP</span>
            </a>
          </div>
        )}
      </div>

      {/* File Content Preview Right Panel */}
      <div className="flex-1 flex flex-col bg-[#090d16]">
        {activeFile ? (
          <>
            <div className="px-5 py-2.5 bg-[#0f172a]/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getExtensionColor(activeFile.rel_path)}`}>
                  {activeFile.rel_path.split('.').pop().toUpperCase()}
                </span>
                <span className="font-mono text-xs font-bold text-slate-200">
                  {activeFile.rel_path}
                </span>
                <span className="text-slate-500 text-xs">• {activeFile.lines} lines</span>
              </div>

              <button
                onClick={() => handleCopy(activeFile.content)}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-[#090d16] font-mono text-xs text-slate-300 leading-relaxed">
              <pre className="whitespace-pre">{activeFile.content}</pre>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
            <Code2 className="w-10 h-10 opacity-20 text-teal-400 mb-2" />
            <span>Select a generated file to preview its code.</span>
          </div>
        )}
      </div>
    </div>
  );
}
