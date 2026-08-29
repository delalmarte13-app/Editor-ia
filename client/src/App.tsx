import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import Agents from "./pages/Agents";
import Export from "./pages/Export";
import Studio from "./pages/Studio";
const App: React.FC = () => <Router><div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden"><aside className="w-64 border-r border-slate-800 flex flex-col"><div className="p-6 border-b border-slate-800"><h1 className="text-xl font-bold tracking-tight text-indigo-400">EditorialAI</h1><p className="text-xs text-slate-500 mt-1">Estudio editorial autónomo</p></div><nav className="flex-1 p-4 space-y-2">{[["/","Estudio"],["/dashboard","Dashboard"],["/editor","Editor"],["/agents","Equipo"],["/export","Descargas"]].map(([to,label])=><NavLink key={to} to={to} end={to==="/"} className={({isActive})=>`block p-3 rounded-lg transition ${isActive?"bg-slate-800 text-indigo-400":"hover:bg-slate-900"}`}>{label}</NavLink>)}</nav><div className="p-4 border-t border-slate-800 text-xs text-slate-500">Director + especialistas + QA</div></aside><main className="flex-1 overflow-auto bg-slate-950"><Routes><Route path="/" element={<Studio/>}/><Route path="/dashboard" element={<Dashboard/>}/><Route path="/editor" element={<Editor/>}/><Route path="/agents" element={<Agents/>}/><Route path="/export" element={<Export/>}/></Routes></main></div></Router>;
export default App;
