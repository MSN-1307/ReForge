import React from 'react';
import { CheckCircle2, Circle, Loader2, Sparkles, Shield, Wrench, FileCode2, Layers, Cpu } from 'lucide-react';

export const PIPELINE_STAGES = [
  { id: 'INGEST', label: 'Ingestion', icon: Layers },
  { id: 'ARCHAEOLOGY', label: 'Archaeologist AST', icon: FileCode2 },
  { id: 'PLANNING', label: 'Mapping Planner', icon: Cpu },
  { id: 'MIGRATION', label: 'Code Generation', icon: Sparkles },
  { id: 'VERIFICATION', label: 'HTTP Verification', icon: Shield },
  { id: 'REPAIR', label: 'Auto Repair', icon: Wrench },
  { id: 'COMPLETED', label: 'Ready', icon: CheckCircle2 }
];

export default function MigrationPipeline({ status = "INITIALIZED", isMigrating = false }) {
  // Map project status to active step index
  const getActiveIndex = () => {
    const s = (status || "").toUpperCase();
    if (s.includes("ARCHAEOLOGIST") || s.includes("ARCHAEOLOGY")) return 1;
    if (s.includes("PLANNING")) return 2;
    if (s.includes("MIGRATION")) return 3;
    if (s.includes("VERIFICATION")) return 4;
    if (s.includes("REPAIR")) return 5;
    if (s.includes("COMPLETED") || s.includes("MIGRATED")) return 6;
    return 0;
  };

  const activeIdx = getActiveIndex();
  const isFinished = status === "COMPLETED" || status === "MIGRATED";

  return (
    <div className="bg-[#0f172a]/95 border-b border-slate-800/80 px-6 py-2.5 backdrop-blur">
      <div className="flex items-center justify-between overflow-x-auto py-1 gap-2">
        {PIPELINE_STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isPassed = isFinished || idx < activeIdx;
          const isCurrent = !isFinished && idx === activeIdx && isMigrating;
          const isUpcoming = !isFinished && idx > activeIdx;

          return (
            <React.Fragment key={stage.id}>
              <div className="flex items-center space-x-2 shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isPassed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isCurrent
                      ? 'bg-teal-500/30 text-teal-300 border border-teal-400 ring-2 ring-teal-500/30 animate-pulse'
                      : 'bg-slate-900 text-slate-600 border border-slate-800'
                  }`}
                >
                  {isCurrent ? (
                    <Loader2 className="w-3 h-3 animate-spin text-teal-300" />
                  ) : isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Icon className="w-3 h-3 text-slate-500" />
                  )}
                </div>

                <span
                  className={`text-[11px] font-semibold whitespace-nowrap ${
                    isPassed
                      ? 'text-slate-300'
                      : isCurrent
                      ? 'text-teal-300 font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {idx < PIPELINE_STAGES.length - 1 && (
                <div
                  className={`h-0.5 flex-1 min-w-[24px] max-w-[50px] transition-all ${
                    idx < activeIdx || isFinished ? 'bg-emerald-500/60' : 'bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
