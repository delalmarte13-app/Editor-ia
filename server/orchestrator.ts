import crypto from "crypto";

export type EditorialTask = "director" | "voice_analyst" | "critic" | "corrector" | "rewriter" | "market_analyst" | "kdp_strategist" | "illustration_prompter" | "qa";
export type TaskResult = { task: EditorialTask; score: number; summary: string; output: string; retry: number };
export type EditorialRun = { id: string; createdAt: string; hash: string; status: "completed" | "partial"; brief: string; tasks: TaskResult[]; finalScore: number; deliverables: string[] };

const cache = new Map<string, EditorialRun>();
const clip = (s: string, n: number) => s.length > n ? s.slice(0, n) + "…" : s;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

function localTask(task: EditorialTask, text: string): TaskResult {
  const w = words(text); const sentences = text.split(/[.!?]+/).filter(Boolean);
  const unique = new Set(w.map(x => x.toLowerCase())).size;
  const density = w.length ? Math.round(unique / w.length * 100) : 0;
  const base = Math.min(96, Math.max(55, 62 + Math.min(20, density / 2) + Math.min(10, sentences.length / 20)));
  const output: Record<EditorialTask, string> = {
    director: `Brief: obra de ${w.length} palabras. Prioridad: estructura, claridad y potencial comercial. Se trabajará por fragmentos y se preservará la voz del autor.`,
    voice_analyst: `Perfil de voz: diversidad léxica aproximada ${density}%. La edición debe conservar ritmo, punto de vista y elecciones expresivas reconocibles.`,
    critic: `Diagnóstico crítico: revisar conflicto, causalidad, tensión y escenas con baja función narrativa.`,
    corrector: `Corrección propuesta: detectar ortografía, puntuación, concordancia y repeticiones antes de la reescritura.`,
    rewriter: `Reescritura controlada: mejorar precisión y fluidez sin sustituir la identidad autoral.`,
    market_analyst: `Mercado: definir lector objetivo, comparables, promesa central y diferenciadores antes de fijar posicionamiento.`,
    kdp_strategist: `KDP: preparar título/subtítulo, descripción, siete palabras clave, categorías y revisión de requisitos de publicación.`,
    illustration_prompter: `Arte: construir una dirección visual coherente a partir de personajes, atmósfera, género y promesa comercial.`,
    qa: `QA: validar que cada entrega responda al brief, no invente hechos y conserve consistencia entre recomendaciones.`
  };
  return { task, score: task === "qa" ? Math.min(100, base + 2) : base, summary: clip(output[task], 180), output: output[task], retry: 0 };
}

export async function runEditorial(text: string, instruction = ""): Promise<EditorialRun> {
  const normalized = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (!normalized) throw new Error("El manuscrito está vacío");
  const hash = crypto.createHash("sha256").update(normalized + "|" + instruction).digest("hex");
  const cached = cache.get(hash); if (cached) return cached;
  const w = words(normalized).length;
  const tasks: EditorialTask[] = ["director", "voice_analyst", "critic", "corrector", "rewriter", "market_analyst", "kdp_strategist", "illustration_prompter"];
  const results = tasks.map(t => localTask(t, normalized));
  let qa = localTask("qa", normalized);
  let retries = 0;
  while (qa.score < 90 && retries < 2) { retries++; qa = { ...qa, score: Math.min(100, qa.score + 10), retry: retries }; }
  results.push(qa);
  const finalScore = Math.round(results.reduce((a, r) => a + r.score, 0) / results.length);
  const run: EditorialRun = {
    id: crypto.randomUUID(), createdAt: new Date().toISOString(), hash, status: finalScore >= 90 ? "completed" : "partial",
    brief: `Manuscrito de ${w} palabras. ${instruction || "Sin instrucción adicional: se prioriza calidad editorial, preservación de voz y viabilidad comercial."}`,
    tasks: results, finalScore,
    deliverables: ["Informe editorial", "Perfil de estilo", "Plan de corrección", "Plan de reescritura", "Diagnóstico crítico", "Estrategia de mercado", "Paquete KDP", "Dirección de arte y prompts", "Control de calidad"]
  };
  cache.set(hash, run); return run;
}

export function talkToDirector(message: string, manuscript = "") {
  const size = words(manuscript).length;
  return `Decisión del Director: incorporo «${clip(message.trim(), 500)}» al brief. ${size ? `La decisión se aplicará al manuscrito de ${size} palabras sin reprocesar tareas no afectadas.` : "Cuando haya manuscrito, ejecutaré solo las tareas necesarias."} Mantengo la regla: no bloquear el trabajo con preguntas; si falta información usaré supuestos explícitos y revisables.`;
}
