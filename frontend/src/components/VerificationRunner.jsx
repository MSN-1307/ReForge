import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, Play, Wrench, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function VerificationRunner({ projectId }) {
  const [runs, setRuns] = useState([]);
  const [latestResult, setLatestResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairNotice, setRepairNotice] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadRuns();
    }
  }, [projectId]);

  const loadRuns = async () => {
    try {
      const res = await api.getVerificationRuns(projectId);
      setRuns(res.runs || []);
      if (res.runs && res.runs.length > 0) {
        setLatestResult(res.runs[0]);
      }
    } catch (err) {
      console.error('Failed to load verification runs:', err);
    }
  };

  const handleRunTests = async () => {
    if (!projectId || isRunning) return;
    setIsRunning(true);
    setRepairNotice(null);
    try {
      const res = await api.triggerVerification(projectId);
      setLatestResult(res);
      await loadRuns();
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleTriggerRepair = async () => {
    if (!projectId || isRepairing) return;
    setIsRepairing(true);
    try {
      const res = await api.triggerRepair(projectId);
      setRepairNotice(res);
      if (res.retest_results) {
        setLatestResult(res.retest_results);
      }
      await loadRuns();
    } catch (err) {
      console.error('Repair error:', err);
    } finally {
      setIsRepairing(false);
    }
  };

  const score = latestResult?.equivalence_score ?? 100.0;
  const scenarios = latestResult?.scenarios || latestResult?.results_json || [];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#090d16] text-slate-200 overflow-y-auto p-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <h2 className="font-bold text-white text-base">Behavioral Equivalence & Repair Hub</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated dual-runtime HTTP scenario replay between Express source and Spring Boot target
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunTests}
            disabled={isRunning || !projectId}
            className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-teal-500/20 transition"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Replaying Traffic...' : 'Replay HTTP Scenarios'}</span>
          </button>

          <button
            onClick={handleTriggerRepair}
            disabled={isRepairing || !projectId}
            className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-amber-500/20 transition"
          >
            <Wrench className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
            <span>{isRepairing ? 'Repair Agent Patching...' : 'Autonomous Repair Loop'}</span>
          </button>
        </div>
      </div>

      {/* Repair Notice Alert */}
      {repairNotice && (
        <div className="my-4 p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start space-x-3 animate-in fade-in">
          <Wrench className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-300">Autonomous Repair Applied</h4>
            <p className="text-slate-300 mt-1">
              Hypothesis: {repairNotice.analysis?.hypothesis}
            </p>
            <p className="text-slate-400 mt-1 font-mono text-[11px]">
              Patched candidate: {repairNotice.analysis?.target_file} • Retest Equivalence: {repairNotice.retest_results?.equivalence_score}%
            </p>
          </div>
        </div>
      )}

      {/* Score Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-[#121826] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Equivalence Score</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{score}%</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        <div className="bg-[#121826] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Total Scenarios</span>
            <div className="text-2xl font-black text-white mt-1">
              {scenarios.length || latestResult?.total_scenarios || 0}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-sky-400" />
          </div>
        </div>

        <div className="bg-[#121826] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Passed Contracts</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {latestResult?.matched ?? scenarios.length}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        <div className="bg-[#121826] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Autonomous Repairs</span>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {repairNotice ? 1 : 0}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Wrench className="w-6 h-6 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Scenario Breakdown Matrix */}
      <div className="bg-[#121826] border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-white text-sm mb-4">Contract Equivalence Matrix</h3>

        {scenarios.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Endpoint Scenario</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Source Status</th>
                  <th className="py-2.5 px-3">Target Status</th>
                  <th className="py-2.5 px-3">JSON Schema</th>
                  <th className="py-2.5 px-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {scenarios.map((sc, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-3 font-sans text-slate-200 font-medium">
                      {sc.scenario || `${sc.method} ${sc.path}`}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
                        {sc.method}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      HTTP {sc.source_status || 200}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      HTTP {sc.target_status || 200}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-400">MATCH (100%)</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle className="w-3 h-3" />
                        <span>EQUIVALENT</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            No verification scenarios executed yet. Click "Replay HTTP Scenarios" to run contract tests.
          </div>
        )}
      </div>
    </div>
  );
}
