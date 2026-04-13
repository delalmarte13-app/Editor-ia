export interface AgentAnalysis {
  id: string;
  agentType: "director" | "voice_analyst" | "critic";
  agentName: string;
  prompt: string;
  response: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface StreamMessage {
  type: "delta" | "complete" | "error";
  content?: string;
  error?: string;
}

export interface AgentStreamPayload {
  projectId: string;
  documentId: string;
  agentType: string;
  prompt?: string;
}

export const AGENT_TYPES = {
  director: {
    name: "Director Editorial",
    description: "Análisis de estructura, ritmo y coherencia narrativa",
  },
  voice_analyst: {
    name: "Analista de Voz",
    description: "Evaluación del tono, estilo y voz del autor",
  },
  critic: {
    name: "Crítico Literario",
    description: "Revisión de calidad literaria y elementos estilísticos",
  },
} as const;
