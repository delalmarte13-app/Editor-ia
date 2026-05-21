import React, { useState } from "react";
import { trpc } from "../trpc";

const Export: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [format, setFormat] = useState("pdf");
  const [isExporting, setIsExporting] = useState(false);
  
  const projects = trpc.projects.list.useQuery();

  const handleExport = async () => {
    if (!selectedProjectId) return;
    setIsExporting(true);
    
    try {
      const response = await fetch("/api/export/maquette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId, format }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_${selectedProjectId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Error al exportar: " + (err as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-2">Exportar y Publicar</h2>
      <p className="text-slate-400 mb-8">Prepara tu obra para el mundo.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
            <span className="text-indigo-400">📄</span>
            <span>Maquetación</span>
          </h3>
          <div className="space-y-4">
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
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Formato</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setFormat("pdf")}
                  className={`py-2 rounded-lg border transition ${format === 'pdf' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                >
                  PDF
                </button>
                <button 
                  onClick={() => setFormat("epub")}
                  className={`py-2 rounded-lg border transition ${format === 'epub' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                >
                  EPUB
                </button>
              </div>
            </div>
            <button 
              onClick={handleExport}
              disabled={!selectedProjectId || isExporting}
              className="w-full bg-slate-50 hover:bg-white text-slate-950 font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {isExporting ? "Generando..." : "Descargar Archivo"}
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
            <span className="text-indigo-400">🎧</span>
            <span>Audiolibro</span>
          </h3>
          <p className="text-sm text-slate-400 mb-6">Genera una versión narrada de tu obra utilizando IA de voz avanzada.</p>
          <button 
            disabled
            className="w-full bg-slate-800 text-slate-500 font-bold py-3 rounded-lg cursor-not-allowed"
          >
            Próximamente
          </button>
        </div>
      </div>
    </div>
  );
};

export default Export;
