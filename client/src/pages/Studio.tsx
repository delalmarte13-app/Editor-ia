import React, { useMemo, useRef, useState } from "react";

const specialists = ["Director editorial", "Corrector", "Reescritor", "Analista de voz", "Crítico", "Mercado", "KDP", "Arte y prompts", "Maquetación"];

export default function Studio() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([{ role: "director", text: "Soy tu Director Editorial. Pega, escribe, sube o dicta tu obra. No detendré el flujo con preguntas: analizaré, decidiré y te mostraré cada decisión para que puedas corregirme cuando quieras." }]);
  const [running, setRunning] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const words = useMemo(() => text.trim() ? text.trim().split(/\s+/).length : 0, [text]);
  const addMessage = (value: string) => {
    if (!value.trim()) return;
    setMessages(m => [...m, { role: "user", text: value }, { role: "director", text: "Recibido. Incorporo tu indicación al brief editorial y reajusto el plan sin reiniciar el trabajo innecesariamente." }]);
  };
  const run = () => {
    if (!text.trim()) return;
    setRunning(true);
    setMessages(m => [...m, { role: "director", text: "Trabajo iniciado: normalización → brief → plan → especialistas necesarios → control de calidad → paquete editorial." }]);
    window.setTimeout(() => {
      setRunning(false);
      setMessages(m => [...m, { role: "director", text: "Primera pasada completada. En la versión conectada al backend, aquí aparecerán resultados persistidos, puntuaciones y descargas." }]);
    }, 900);
  };
  return <div className="h-full flex flex-col p-6 gap-4 overflow-auto">
    <div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold">Estudio Editorial</h2><p className="text-slate-400 text-sm">Una sola entrada. Una editorial completa detrás.</p></div><button onClick={run} disabled={running || !text.trim()} className="bg-indigo-600 px-4 py-2 rounded font-medium disabled:opacity-50">{running ? "Trabajando…" : "Iniciar producción"}</button></div>
    <div className="grid lg:grid-cols-[1fr_360px] gap-4 min-h-0 flex-1">
      <section className="border border-slate-800 rounded-xl p-4 flex flex-col min-h-[520px]"><div className="flex gap-2 mb-3"><button onClick={() => file.current?.click()} className="px-3 py-2 rounded bg-slate-800 text-sm">Subir archivo</button><button onClick={() => navigator.clipboard?.readText().then(setText)} className="px-3 py-2 rounded bg-slate-800 text-sm">Pegar</button><button onClick={() => { const SR=(window as any).webkitSpeechRecognition || (window as any).SpeechRecognition; if(!SR) return; const r=new SR(); r.lang="es-ES"; r.onresult=(e:any)=>setText(t=>t+(t?" ":"")+e.results[0][0].transcript); r.start(); }} className="px-3 py-2 rounded bg-slate-800 text-sm">🎙 Dictar</button><input ref={file} type="file" accept=".txt,.md" className="hidden" onChange={async e=>{const f=e.target.files?.[0]; if(f) setText(await f.text());}}/></div><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Escribe o pega tu manuscrito aquí…" className="flex-1 min-h-[420px] bg-slate-950 border border-slate-800 rounded-lg p-4 font-serif text-lg outline-none"/><div className="pt-2 text-xs text-slate-500">{words.toLocaleString()} palabras · {text.length.toLocaleString()} caracteres</div></section>
      <aside className="border border-slate-800 rounded-xl flex flex-col overflow-hidden"><div className="p-4 border-b border-slate-800"><b>Director Editorial</b><p className="text-xs text-slate-400 mt-1">Control central y revisión final</p></div><div className="flex-1 p-3 overflow-auto space-y-3">{messages.map((m,i)=><div key={i} className={m.role==="user"?"text-right":""}><span className={m.role==="user"?"inline-block bg-indigo-600 rounded-lg p-3 text-sm text-left":"inline-block bg-slate-800 rounded-lg p-3 text-sm"}>{m.text}</span></div>)}</div><ChatBox onSend={addMessage}/></aside>
    </div>
    <section className="border border-slate-800 rounded-xl p-4"><h3 className="font-semibold mb-3">Equipo editorial y control de calidad</h3><div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-2">{specialists.map((s,i)=><div key={s} className="bg-slate-900 rounded p-3 text-sm"><span className="text-indigo-400">{i===0?"●":"○"}</span> {s}<div className="text-xs text-slate-500 mt-1">{i===0?"Orquesta y valida":"Bajo demanda"}</div></div>)}</div></section>
  </div>;
}
function ChatBox({onSend}:{onSend:(s:string)=>void}) { const [v,setV]=useState(""); return <form className="p-3 border-t border-slate-800 flex gap-2" onSubmit={e=>{e.preventDefault();onSend(v);setV("")}}><input value={v} onChange={e=>setV(e.target.value)} placeholder="Habla con el Director…" className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm"/><button className="bg-indigo-600 rounded px-3">Enviar</button></form> }
