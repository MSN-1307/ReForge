import React, { useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import { Layers, Info, Filter, Code2, Database, Shield } from 'lucide-react';

export default function ArchitectureGraph({ graphData }) {
  const initialNodes = graphData?.nodes || [];
  const initialEdges = graphData?.edges || [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);

  const onNodeClick = (_, node) => {
    setSelectedNode(node);
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] bg-[#090d16]">
      {/* Top Legend & Statistics Bar */}
      <div className="absolute top-4 left-4 z-10 bg-[#121826]/95 border border-slate-800 rounded-xl p-3.5 backdrop-blur shadow-xl text-xs">
        <div className="flex items-center space-x-2 font-bold text-white mb-2">
          <Layers className="w-4 h-4 text-teal-400" />
          <span>Codebase Knowledge Graph</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
            <span className="text-slate-300">Route / Endpoint ({graphData?.summary?.route_count || 0})</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
            <span className="text-slate-300">Model / Entity ({graphData?.summary?.model_count || 0})</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]"></span>
            <span className="text-slate-300">Source Module</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></span>
            <span className="text-slate-300">Middleware</span>
          </div>
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="absolute top-4 right-4 z-10 w-80 bg-[#121826]/95 border border-slate-700 rounded-xl p-4 backdrop-blur shadow-2xl text-xs animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-white uppercase tracking-wider text-[10px]">
                Node Inspector
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold">Label</span>
              <p className="text-sm font-bold text-teal-300">{selectedNode.data?.label}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold">Type</span>
              <p className="text-slate-300">{selectedNode.data?.nodeType}</p>
            </div>

            {selectedNode.data?.details && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-semibold">
                  Extracted Properties
                </span>
                <pre className="mt-1 bg-[#090d16] p-2 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-800/80">
                  {JSON.stringify(selectedNode.data.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* React Flow Canvas */}
      {nodes.length > 0 ? (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls className="bg-slate-900 border-slate-800 fill-slate-300" />
          <MiniMap
            nodeColor={(n) => n.style?.border?.split(' ')[2] || '#64748b'}
            className="bg-slate-950 border border-slate-800 rounded-lg"
          />
        </ReactFlow>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
          <Layers className="w-10 h-10 opacity-30 text-teal-400" />
          <p className="text-sm">Knowledge graph will render once the project is analyzed.</p>
        </div>
      )}
    </div>
  );
}
