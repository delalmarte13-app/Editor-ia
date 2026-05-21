import React, { useState } from "react";
import { trpc } from "../trpc";

const Dashboard: React.FC = () => {
  const [newTitle, setNewTitle] = useState("");
  const [newGenre, setNewGenre] = useState("");
  
  const utils = trpc.useUtils();
  const projects = trpc.projects.list.useQuery();
  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      setNewTitle("");
      setNewGenre("");
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    createProject.mutate({ title: newTitle, genre: newGenre });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold">Mis Proyectos</h2>
          <p className="text-slate-400">Gestiona tus obras literarias</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 col-span-1">
          <h3 className="text-lg font-semibold mb-4">Nuevo Proyecto</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Título</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="El nombre de tu obra..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Género</label>
              <input 
                type="text" 
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Fantasía, Drama, etc."
              />
            </div>
            <button 
              type="submit"
              disabled={createProject.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {createProject.isPending ? "Creando..." : "Crear Proyecto"}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : projects.data?.length === 0 ? (
            <div className="col-span-full bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-12 text-center">
              <p className="text-slate-500">No tienes proyectos aún. ¡Crea el primero!</p>
            </div>
          ) : (
            projects.data?.map((project) => (
              <div key={project.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition group">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase rounded">
                    {project.status}
                  </span>
                  <span className="text-slate-600 text-[10px]">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-lg font-bold mb-1 group-hover:text-indigo-400 transition">{project.title}</h4>
                <p className="text-sm text-slate-400 mb-4">{project.genre || "Sin género"}</p>
                <div className="flex justify-end">
                  <button className="text-xs text-indigo-400 font-medium hover:underline">Abrir Editor →</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
