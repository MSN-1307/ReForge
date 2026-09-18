import React from 'react';
import { ArrowRight, Check, Sparkles, Cpu, Zap, Layers, Server } from 'lucide-react';

export const TARGET_OPTIONS = [
  {
    id: 'spring_boot',
    name: 'Java Spring Boot 3',
    language: 'Java',
    badge: 'Enterprise Standard',
    color: 'from-orange-500/20 to-amber-500/10 border-amber-500/40 text-amber-300',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10',
    desc: 'Production-ready enterprise MVC with JPA Entities, Repositories, Maven POM, and H2/PostgreSQL config.'
  },
  {
    id: 'fastapi',
    name: 'Python FastAPI',
    language: 'Python',
    badge: 'High Performance',
    color: 'from-teal-500/20 to-emerald-500/10 border-teal-500/40 text-teal-300',
    iconColor: 'text-teal-400',
    iconBg: 'bg-teal-500/10',
    desc: 'Modern asynchronous Python API with Pydantic v2 data validation schemas and SQLAlchemy ORM models.'
  },
  {
    id: 'flask',
    name: 'Python Flask',
    language: 'Python',
    badge: 'Lightweight & Clean',
    color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/40 text-blue-300',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    desc: 'Modular microservice using Flask Blueprints, SQLAlchemy declarative models, and CORS integration.'
  },
  {
    id: 'gin',
    name: 'Go Gin',
    language: 'Go',
    badge: 'Blazing Fast Binary',
    color: 'from-cyan-500/20 to-sky-500/10 border-cyan-500/40 text-cyan-300',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10',
    desc: 'Compiled native binary architecture with Gin HTTP router, GORM SQLite/Postgres structs, and zero overhead.'
  },
  {
    id: 'express',
    name: 'Node.js Express',
    language: 'JavaScript',
    badge: 'Universal JS/TS',
    color: 'from-emerald-500/20 to-green-500/10 border-emerald-500/40 text-emerald-300',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    desc: 'Standard Node.js REST router, clean asynchronous controllers, middleware pipeline, and package.json.'
  }
];

export default function LanguageSelector({ selectedTarget, onSelectTarget, currentSource = "JavaScript / Express" }) {
  return (
    <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Universal Migration Target</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Converting from <span className="font-semibold text-teal-300">{currentSource}</span> to your desired language
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Target Framework:</span>
          <span className="px-2.5 py-0.5 rounded-full font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30">
            {TARGET_OPTIONS.find(t => t.id === selectedTarget)?.name || "Java Spring Boot 3"}
          </span>
        </div>
      </div>

      {/* Target Framework Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {TARGET_OPTIONS.map((opt) => {
          const isSelected = selectedTarget === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => onSelectTarget(opt.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 select-none relative flex flex-col justify-between ${
                isSelected
                  ? `bg-gradient-to-b ${opt.color} shadow-lg shadow-teal-500/10 ring-1 ring-teal-400/50 scale-[1.02]`
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-950/80 text-slate-300 border border-slate-800">
                    {opt.language}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                      isSelected ? 'bg-teal-500 border-teal-400 text-white' : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                <h4 className="font-bold text-white text-xs mb-1">{opt.name}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3 mb-2">{opt.desc}</p>
              </div>

              <span className={`text-[10px] font-semibold mt-1 px-2 py-0.5 rounded text-center ${
                isSelected ? 'bg-teal-500/20 text-teal-200' : 'bg-slate-800 text-slate-400'
              }`}>
                {opt.badge}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
