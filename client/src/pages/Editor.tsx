import React, { useState, useEffect } from "react";
import { trpc } from "../trpc";

const Editor: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [versionLabel, setVersionLabel] = useState("v1");
  
  const projects = trpc.projects.list.useQuery();
  const latestDoc = trpc.documents.getLatest.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  
  const saveDoc = trpc.documents.create.useMutation();

  useEffect(() => {
    if (latestDoc.data) {
      setContent(latestDoc.data.content);
    }
  }, [latestDoc.data]);

  // Autosave every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      if (selectedProjectId && content) {
        saveDoc.mutate({ projectId: selectedProjectId, content, versionLabel });
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [selectedProjectId, content, versionLabel]);

  const handleSave = () => {
    if (selectedProjectId && content) {
      saveDoc.mutate({ projectId: selectedProjectId, content, versionLabel });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center space-x-4">
          <select 
            className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            value={selectedProjectId || ""}
          >
            <option value="" disabled>Seleccionar proyecto...</option>
            {projects.data?.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          {saveDoc.isPending && <span className="text-xs text-slate-500 animate-pulse">Guardando...</span>}
        </div>
        <div className="flex items-center space-x-3">
          <input 
            type="text" 
            value={versionLabel}
            onChange={(e) => setVersionLabel(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm w-24 outline-none"
            placeholder="Versión"
          />
          <button 
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded text-sm font-medium transition"
          >
            Guardar
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-8 overflow-auto">
          <textarea 
            className="w-full h-full bg-transparent resize-none outline-none font-serif text-lg leading-relaxed placeholder:text-slate-700"
            placeholder="Empieza a escribir tu obra maestra..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        
        <aside className="w-64 border-l border-slate-800 p-6 bg-slate-900/30">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Estadísticas</h3>
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold">{content.split(/\s+/).filter(Boolean).length}</p>
              <p className="text-xs text-slate-500">Palabras</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{content.length}</p>
              <p className="text-xs text-slate-500">Caracteres</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Editor;
