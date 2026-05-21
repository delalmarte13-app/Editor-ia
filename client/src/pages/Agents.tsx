import React, { useState } from "react";
import { trpc } from "../trpc";

const Agents: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [agentType, setAgentType] = useState("corrector");
  const [result, setResult] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const projects = trpc.projects.list.useQuery();

  const runAgent = async () => {
    if (!selectedProjectId) return;
    setResult("");
    setIsStreaming(true);

    try {
      const response = await fetch("/api/stream/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: String(selectedProjectId), agentType }),
      });

      if (!response.ok) throw new Error("Error en el agente");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                setResult(prev => prev + parsed.choices[0].delta.content);
              } else if (parsed.content) {
                setResult(prev => prev + parsed.content);
              }
            } catch (e) {
              // Ignorar errores de parseo de chunks incompletos
            }
          }
        }
      }
    } catch (err) {
      setResult("Error: " + (err as Error).message);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-2">Agentes IA</h2>
      <p className="text-slate-400 mb-8">Utiliza agentes especializados para mejorar tu obra.</p>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Proyecto</label>
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
              value={selectedProjectId || ""}
            >
              <option value="" disabled>Seleccionar proyecto...</option>
              {projects.data?.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Tipo de Agente</label>
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => setAgentType(e.target.value)}
              value={agentType}
            >
              <option value="corrector">Corrector de Estilo</option>
              <option value="rewriter">Reescritor</option>
              <option value="style_guardian">Guardián de Estilo</option>
              <option value="illustrator_style">Estilo de Ilustración</option>
              <option value="illustration_prompter">Prompter de Ilustración</option>
              <option value="market_analyst">Analista de Mercado</option>
              <option value="kdp_strategist">Estratega KDP</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={runAgent}
          disabled={!selectedProjectId || isStreaming}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {isStreaming ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Procesando...</span>
            </>
          ) : (
            <span>Ejecutar Agente</span>
          )}
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[300px] flex flex-col">
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Resultado</h3>
        <textarea 
          readOnly
          className="flex-1 bg-transparent resize-none outline-none font-mono text-sm leading-relaxed text-slate-300"
          placeholder="El resultado del agente aparecerá aquí..."
          value={result}
        />
      </div>
    </div>
  );
};

export default Agents;
