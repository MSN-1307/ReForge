import React, { useState } from 'react';
import { Sparkles, Box, Database, BookOpen, CheckCircle, Play, FileCode, Check } from 'lucide-react';
import { api } from '../services/api';

export default function ModernizationCenter({ projectId }) {
  const [upgrades, setUpgrades] = useState({
    docker: true,
    openapi: true,
    redis: true,
  });
  const [isApplying, setIsApplying] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState(null);

  const toggleUpgrade = (key) => {
    setUpgrades((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApply = async () => {
    if (!projectId || isApplying) return;
    setIsApplying(true);
    try {
      const selected = Object.keys(upgrades).filter((k) => upgrades[k]);
      const res = await api.executeMigration(projectId, selected);
      setAppliedNotice(res);
    } catch (err) {
      console.error('Failed to apply modernization:', err);
    } finally {
      setIsApplying(false);
    }
  };

  const options = [
    {
      id: 'docker',
      title: 'Docker & Compose Containerization',
      icon: Box,
      color: 'text-blue-400',
      description:
        'Generates multi-stage production Dockerfile and multi-service docker-compose.yml for target Spring Boot app and database.',
      features: ['Multi-stage Maven build', 'Alpine JRE runtime container', 'docker-compose orchestration'],
    },
    {
      id: 'openapi',
      title: 'OpenAPI 3 / Swagger Documentation',
      icon: BookOpen,
      color: 'text-emerald-400',
      description:
        'Injects springdoc-openapi-starter-webmvc-ui into pom.xml and configures interactive Swagger UI at /swagger-ui.html.',
      features: ['Automated JSON API Schema', 'Interactive Swagger UI', 'Zero-code documentation maintenance'],
    },
    {
      id: 'redis',
      title: 'Redis Distributed Caching Layer',
      icon: Database,
      color: 'text-red-400',
      description:
        'Configures Spring Cache abstraction with Redis backing for high-performance sub-millisecond query responses.',
      features: ['@EnableCaching bootstrap', 'Redis standalone / clustered support', 'Spring Data Redis starter'],
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#090d16] text-slate-200 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <h2 className="font-bold text-white text-base">Modernization Center</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Opt-in cloud-native architectural enhancements applied seamlessly during code modernization
          </p>
        </div>

        <button
          onClick={handleApply}
          disabled={isApplying || !projectId}
          className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-teal-500/20 transition"
        >
          <Play className={`w-3.5 h-3.5 ${isApplying ? 'animate-spin' : ''}`} />
          <span>{isApplying ? 'Applying Upgrades...' : 'Apply Selected Modernizations'}</span>
        </button>
      </div>

      {/* Applied Notice Banner */}
      {appliedNotice && (
        <div className="my-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start space-x-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-emerald-300">Modernization Recipe Deployed!</h4>
            <p className="text-slate-300 mt-1">
              Upgrades injected into Spring Boot target: Dockerfile, docker-compose.yml, and springdoc OpenAPI dependencies.
            </p>
          </div>
        </div>
      )}

      {/* Modernization Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = !!upgrades[opt.id];
          return (
            <div
              key={opt.id}
              onClick={() => toggleUpgrade(opt.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 select-none flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#121826] border-teal-500/50 shadow-lg shadow-teal-500/10'
                  : 'bg-[#0f141f] border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center ${opt.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                      isSelected
                        ? 'bg-teal-500 border-teal-400 text-white'
                        : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <h3 className="font-bold text-white text-sm mb-1.5">{opt.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{opt.description}</p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
                {opt.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center space-x-2 text-[11px] text-slate-300">
                    <CheckCircle className="w-3 h-3 text-teal-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
