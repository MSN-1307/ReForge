import React, { useState } from 'react';
import { Send, Sparkles, FileText, CheckCircle2, Bot, User, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function CodebaseChat({ projectId }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your **Archaeologist Codebase Assistant**. You can ask me anything about the legacy codebase architecture, Express routes, Mongoose models, or how they will be deterministically mapped to Spring Boot.\n\nEvery answer is backed by exact AST extractions and NetworkX graph facts.',
      evidence: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    'What routes and endpoints are exposed?',
    'What data models and fields are defined?',
    'How will Express routes map to Spring Boot controllers?',
    'What modernization upgrades are recommended?',
  ];

  const handleSend = async (queryText = null) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || !projectId || loading) return;

    const userMessage = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage(projectId, textToSend);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          evidence: res.evidence || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error retrieving evidence: ${err.message}`,
          evidence: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#0b0f19] text-slate-200">
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-teal-400" />
          <h2 className="font-bold text-white text-sm">Evidence-Backed Codebase Chat</h2>
        </div>
        <span className="text-xs text-slate-400">Powered by AST + NetworkX Fact Catalog</span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-3 max-w-3xl ${
              m.role === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                m.role === 'user' ? 'bg-teal-600' : 'bg-slate-800 border border-slate-700'
              }`}
            >
              {m.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-teal-400" />
              )}
            </div>

            <div
              className={`rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                m.role === 'user'
                  ? 'bg-teal-950/60 border border-teal-500/30 text-teal-100'
                  : 'bg-[#121826] border border-slate-800 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{m.content}</div>

              {/* Evidence Citations */}
              {m.evidence && m.evidence.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified AST Citations:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {m.evidence.map((ev, evIdx) => (
                      <span
                        key={evIdx}
                        className="inline-flex items-center space-x-1 bg-[#090d16] border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300"
                      >
                        <FileText className="w-3 h-3 text-emerald-400" />
                        <span>{ev.file} {ev.line ? `#L${ev.line}` : ''}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <Bot className="w-4 h-4 text-teal-400 animate-spin" />
            </div>
            <span className="animate-pulse">Consulting AST catalog & Knowledge Graph...</span>
          </div>
        )}
      </div>

      {/* Suggested Questions Pills */}
      <div className="px-6 py-2 bg-[#0d1117] border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-[11px]">
        <span className="text-slate-500 shrink-0">Quick Queries:</span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="shrink-0 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white px-2.5 py-1 rounded-md border border-slate-700/60 transition flex items-center space-x-1"
          >
            <span>{q}</span>
            <ArrowRight className="w-2.5 h-2.5 text-teal-400" />
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-[#0f172a] border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Ask anything about the codebase architecture or migration rules..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition shadow-md shadow-teal-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
