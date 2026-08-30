export type ProviderId = 'groq' | 'gemini' | 'openrouter' | 'huggingface' | 'ollama' | 'openai';

export interface ProviderConfig {
  id: ProviderId;
  envKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  priority: number;
  freeTier: boolean;
}

export const PROVIDERS: ProviderConfig[] = [
  { id: 'ollama', baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434', defaultModel: process.env.OLLAMA_MODEL || 'llama3.2', priority: 1, freeTier: true },
  { id: 'groq', envKey: 'GROQ_API_KEY', baseUrl: 'https://api.groq.com/openai/v1', defaultModel: process.env.GROQ_MODEL || 'llama-3.1-8b-instant', priority: 2, freeTier: true },
  { id: 'gemini', envKey: 'GEMINI_API_KEY', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash', priority: 3, freeTier: true },
  { id: 'openrouter', envKey: 'OPENROUTER_API_KEY', baseUrl: 'https://openrouter.ai/api/v1', defaultModel: process.env.OPENROUTER_MODEL || 'google/gemma-3-4b-it:free', priority: 4, freeTier: true },
  { id: 'huggingface', envKey: 'HUGGINGFACE_API_KEY', baseUrl: 'https://router.huggingface.co/v1', defaultModel: process.env.HUGGINGFACE_MODEL || 'Qwen/Qwen2.5-7B-Instruct', priority: 5, freeTier: true },
  { id: 'openai', envKey: 'OPENAI_API_KEY', baseUrl: 'https://api.openai.com/v1', defaultModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini', priority: 99, freeTier: false },
];

export function availableProviders(env: NodeJS.ProcessEnv = process.env): ProviderConfig[] {
  return PROVIDERS.filter((provider) => !provider.envKey || Boolean(env[provider.envKey])).sort((a, b) => a.priority - b.priority);
}

export function providerFor(env: NodeJS.ProcessEnv = process.env): ProviderConfig | undefined {
  return availableProviders(env)[0];
}
