import React, { useState, useEffect, useRef } from 'react';
import { Terminal, CheckCircle, Brain, Search, Clock, Cpu, Filter, ChevronDown, ChevronRight } from 'lucide-react';

export default function AgentActivityConsole({ events, isMigrating }) {
  const [filter, setFilter] = useState('ALL'); // ALL, EVIDENCE, ANALYSIS, HYPOTHESIS
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  const toggleExpand = (id) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const counts = {
    ALL: events.length,
    EVIDENCE: events.filter((e) => e.category === 'EVIDENCE').length,
    ANALYSIS: events.filter((e) => e.category === 'ANALYSIS').length,
    HYPOTHESIS: events.filter((e) => e.category === 'HYPOTHESIS').length,
  };

  const filteredEvents = events.filter((e) => {
    const matchesCategory = filter === 'ALL' || e.category === filter;
    const matchesSearch =
      searchTerm === '' ||
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.details && e.details.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categoryBadges = {
    EVIDENCE: {
      label: 'Observed Evidence',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle,
      dot: 'bg-emerald-400'
    },
    ANALYSIS: {
      label: 'Derived Analysis',
      bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      icon: Cpu,
      dot: 'bg-sky-400'
    },
    HYPOTHESIS: {
      label: 'LLM Hypothesis',
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      icon: Brain,
      dot: 'bg-purple-400'
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#0b0f19] p-4 text-slate-200">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-teal-400" />
          <h2 className="text-base font-bold text-white tracking-wide">Agent Activity Console</h2>
          {isMigrating && (
            <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              <span>LangGraph Active</span>
            </span>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filter === 'ALL'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({counts.ALL})
          </button>
          <button
            onClick={() => setFilter('EVIDENCE')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-medium transition ${
              filter === 'EVIDENCE'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Evidence ({counts.EVIDENCE})</span>
          </button>
          <button
            onClick={() => setFilter('ANALYSIS')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-medium transition ${
              filter === 'ANALYSIS'
                ? 'bg-sky-950/80 text-sky-300 border border-sky-500/40'
                : 'text-sky-400/80 hover:text-sky-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>Analysis ({counts.ANALYSIS})</span>
          </button>
          <button
            onClick={() => setFilter('HYPOTHESIS')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-medium transition ${
              filter === 'HYPOTHESIS'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                : 'text-purple-400/80 hover:text-purple-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Hypotheses ({counts.HYPOTHESIS})</span>
          </button>
        </div>

        {/* Search & Auto-Scroll Toggle */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-teal-500 w-48 transition"
            />
          </div>

          <label className="flex items-center space-x-1.5 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-0 focus:ring-offset-0"
            />
            <span>Auto-scroll</span>
          </label>
        </div>
      </div>

      {/* Events Stream Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1">
        {filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Terminal className="w-10 h-10 opacity-30 text-teal-400" />
            <p className="text-sm">No agent events logged yet.</p>
            <p className="text-xs text-slate-600">
              Load a project or click "Run Autonomous Migration" to watch the agents execute.
            </p>
          </div>
        ) : (
          filteredEvents.map((e, idx) => {
            const badge = categoryBadges[e.category] || categoryBadges.ANALYSIS;
            const isExpanded = !!expandedItems[e.id || idx];
            const hasMeta = e.metadata && Object.keys(e.metadata).length > 0;

            return (
              <div
                key={e.id || idx}
                className="bg-[#121826] border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 transition shadow-sm font-sans"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    {/* Badge Category Tag */}
                    <div
                      className={`flex items-center space-x-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border ${badge.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                      <span>{badge.label}</span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-300">
                          {e.agent_name}
                        </span>
                        <span className="text-slate-600">•</span>
                        <h4 className="text-xs font-semibold text-white tracking-wide">
                          {e.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {e.details}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    <span>{e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : 'Just now'}</span>
                    {hasMeta && (
                      <button
                        onClick={() => toggleExpand(e.id || idx)}
                        className="text-slate-400 hover:text-teal-400 ml-1 p-0.5 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Metadata Drawer */}
                {isExpanded && hasMeta && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <div className="bg-[#090d16] rounded-lg p-2.5 text-[11px] font-mono text-emerald-400 border border-slate-800 overflow-x-auto">
                      <pre>{JSON.stringify(e.metadata, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
