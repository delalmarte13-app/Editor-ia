import type { EditorialMemory } from './domain';

export interface MemoryInput {
  projectId: string;
  summary?: string;
  facts?: string[];
  characters?: string[];
  places?: string[];
  decisions?: string[];
  openIssues?: string[];
}

const unique = (items: string[] = []) => [...new Set(items.map((x) => x.trim()).filter(Boolean))];

/** Compact structured memory. Deterministic and intentionally LLM-free. */
export function buildEditorialMemory(input: MemoryInput, previous?: EditorialMemory): EditorialMemory {
  return {
    projectId: input.projectId,
    summary: (input.summary ?? previous?.summary ?? '').trim(),
    facts: unique([...(previous?.facts ?? []), ...(input.facts ?? [])]),
    characters: unique([...(previous?.characters ?? []), ...(input.characters ?? [])]),
    places: unique([...(previous?.places ?? []), ...(input.places ?? [])]),
    decisions: unique([...(previous?.decisions ?? []), ...(input.decisions ?? [])]),
    openIssues: unique([...(previous?.openIssues ?? []), ...(input.openIssues ?? [])]),
    updatedAt: new Date().toISOString(),
  };
}

export function compactMemory(memory: EditorialMemory, maxItems = 50): EditorialMemory {
  const cap = Math.max(1, maxItems);
  return {
    ...memory,
    facts: memory.facts.slice(-cap),
    characters: memory.characters.slice(-cap),
    places: memory.places.slice(-cap),
    decisions: memory.decisions.slice(-cap),
    openIssues: memory.openIssues.slice(-cap),
  };
}
