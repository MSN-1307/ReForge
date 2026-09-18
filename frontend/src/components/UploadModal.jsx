import React, { useState } from 'react';
import { Upload, BookOpen, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function UploadModal({ isOpen, onClose, onProjectLoaded }) {
  const [file, setFile] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [loadingSample, setLoadingSample] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleLoadSample = async () => {
    setLoadingSample(true);
    setError(null);
    try {
      const res = await api.loadSampleProject();
      onProjectLoaded(res);
      onClose();
    } catch (err) {
      setError(`Failed to load sample project: ${err.message}`);
    } finally {
      setLoadingSample(false);
    }
  };

  const handleUploadZip = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await api.uploadZip(file, projectName || file.name.replace('.zip', ''));
      onProjectLoaded(res);
      onClose();
    } catch (err) {
      setError(`Failed to upload archive: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121826] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-white text-base">Ingest Legacy Codebase</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Option 1: 1-Click Express Bookstore Sample */}
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-teal-500/40 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 uppercase">
                    Recommended 1-Click Demo
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm mt-2">
                  Express Bookstore API (Sample)
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Realistic Express service featuring Mongoose models, REST endpoints, and Jest unit tests.
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-teal-400" />
              </div>
            </div>

            <button
              onClick={handleLoadSample}
              disabled={loadingSample || uploading}
              className="mt-4 w-full flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-500 text-white py-2 px-4 rounded-lg text-xs font-semibold shadow-md shadow-teal-500/20 transition disabled:opacity-50"
            >
              <span>{loadingSample ? 'Ingesting Sample...' : 'Load Express Bookstore API'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-1 border-t border-slate-800"></div>
            <span className="text-[11px] uppercase font-bold text-slate-500">Or Upload ZIP</span>
            <div className="flex-1 border-t border-slate-800"></div>
          </div>

          {/* Option 2: Upload ZIP */}
          <form onSubmit={handleUploadZip} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Project Name (Optional)
              </label>
              <input
                type="text"
                placeholder="My Express Service"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Select .ZIP Archive
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
              disabled={!file || uploading || loadingSample}
              className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 py-2.5 rounded-lg text-xs font-semibold border border-slate-700 transition"
            >
              {uploading ? 'Uploading & Unpacking...' : 'Upload & Start Archaeologist'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
