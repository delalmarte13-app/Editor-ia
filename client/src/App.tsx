import React from "react";

import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import Agents from "./pages/Agents";
import Export from "./pages/Export";

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 flex flex-col">
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold tracking-tight text-indigo-400">EditorialAI</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <NavLink to="/" className={({ isActive }) => `block p-3 rounded-lg transition ${isActive ? 'bg-slate-800 text-indigo-400' : 'hover:bg-slate-900'}`}>
              Dashboard
            </NavLink>
            <NavLink to="/editor" className={({ isActive }) => `block p-3 rounded-lg transition ${isActive ? 'bg-slate-800 text-indigo-400' : 'hover:bg-slate-900'}`}>
              Editor
            </NavLink>
            <NavLink to="/agents" className={({ isActive }) => `block p-3 rounded-lg transition ${isActive ? 'bg-slate-800 text-indigo-400' : 'hover:bg-slate-900'}`}>
              Agentes
            </NavLink>
            <NavLink to="/export" className={({ isActive }) => `block p-3 rounded-lg transition ${isActive ? 'bg-slate-800 text-indigo-400' : 'hover:bg-slate-900'}`}>
              Exportar
            </NavLink>
          </nav>
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center space-x-3 p-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">U</div>
              <span className="text-sm font-medium">Usuario</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-950">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/export" element={<Export />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
