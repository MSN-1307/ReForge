import React, { useState } from 'react';
import { Upload, BookOpen, X, CheckCircle2, ArrowRight, Code2, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function UploadModal({ isOpen, onClose, onProjectLoaded, currentTarget, onChangeTarget }) {
  const [file, setFile] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [targetFramework, setTargetFramework] = useState(currentTarget || 'spring_boot');
  const [loadingSample, setLoadingSample] = useState(null); // 'express' | 'python' | null
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleLoadSample = async (type) => {
    setLoadingSample(type);
    setError(null);
    try {
      let res;
      if (type === 'python') {
        res = await api.loadPythonSampleProject();
      } else {
        res = await api.loadSampleProject();
      }
      onProjectLoaded(res);
      onClose();
    } catch (err) {
      setError(`Failed to load sample project: ${err.message}`);
    } finally {
      setLoadingSample(null);
    }
  };

  const handleUploadZip = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await api.uploadZip(file, projectName || file.name.replace('.zip', ''), targetFramework);
      onProjectLoaded(res);
      if (onChangeTarget) onChangeTarget(targetFramework);
      onClose();
    } catch (err) {
      setError(`Failed to upload archive: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121826] border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-white text-base">Ingest Any Project / Codebase</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Quick-Start Demo Templates */}
          <div>
            <span className="text-[11px] uppercase font-bold text-teal-400 tracking-wider flex items-center space-x-1 mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Interactive Demos</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Template 1: Express */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-teal-500/40 rounded-xl p-3.5 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                      JavaScript / Express
                    </span>
                    <BookOpen className="w-4 h-4 text-teal-400" />
                  </div>
                  <h4 className="font-bold text-white text-xs">Express Bookstore API</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    CRUD routes, Mongoose schema, auth middleware, and Jest tests.
                  </p>
                </div>

                <button
                  onClick={() => handleLoadSample('express')}
                  disabled={loadingSample !== null || uploading}
                  className="mt-3 w-full flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 px-3 rounded-lg text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
                >
                  <span>{loadingSample === 'express' ? 'Loading...' : 'Load Express Demo'}</span>
                  <ArrowRight className="w-3 h-3 text-teal-400" />
                </button>
              </div>

              {/* Template 2: Python */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-teal-500/40 rounded-xl p-3.5 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
                      Python / Flask
                    </span>
                    <Code2 className="w-4 h-4 text-teal-400" />
                  </div>
                  <h4 className="font-bold text-white text-xs">Python Task API</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Flask blueprints, SQLAlchemy models, SQLite configuration.
                  </p>
                </div>

                <button
                  onClick={() => handleLoadSample('python')}
                  disabled={loadingSample !== null || uploading}
                  className="mt-3 w-full flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 px-3 rounded-lg text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
                >
                  <span>{loadingSample === 'python' ? 'Loading...' : 'Load Python Demo'}</span>
                  <ArrowRight className="w-3 h-3 text-teal-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-1 border-t border-slate-800"></div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Or Upload Any Project ZIP</span>
            <div className="flex-1 border-t border-slate-800"></div>
          </div>

          {/* Upload Custom Project Form */}
          <form onSubmit={handleUploadZip} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Project Name
              </label>
              <input
                type="text"
                placeholder="My Legacy API Service"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Desired Target Framework
              </label>
              <select
                value={targetFramework}
                onChange={(e) => setTargetFramework(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 transition"
              >
                <option value="spring_boot">Java Spring Boot 3 (Enterprise MVC & JPA)</option>
                <option value="fastapi">Python FastAPI (Async + Pydantic v2)</option>
                <option value="flask">Python Flask (Lightweight Blueprints)</option>
                <option value="gin">Go Gin (High-Speed Binary + GORM)</option>
                <option value="express">Node.js Express (Universal JavaScript)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Select .ZIP Archive (Any Language: Python, JS, TS, PHP, Ruby, Go)
              </label>
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={!file || uploading || loadingSample !== null}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-xs font-semibold shadow-md shadow-teal-500/20 transition"
            >
              {uploading ? 'Analyzing Codebase...' : 'Upload & Auto-Detect Architecture'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
