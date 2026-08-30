import { buildEditorialMemory } from './memory';
import { normalizeManuscript } from './normalize';
import { createEditorialPlan } from './planner';
import { segmentManuscript } from './segment';
import type { EditorialMemory } from './domain';

export interface EditorialPreparation {
  normalized: ReturnType<typeof normalizeManuscript>;
  segments: ReturnType<typeof segmentManuscript>;
  memory: EditorialMemory;
  plan: ReturnType<typeof createEditorialPlan>;
}

/** Token-efficient deterministic preparation before any LLM call. */
export function prepareEditorialRun(input: {
  projectId: string;
  text: string;
  objective: string;
  previousMemory?: EditorialMemory;
}): EditorialPreparation {
  const normalized = normalizeManuscript(input.text);
  const segments = segmentManuscript(normalized.text);
  const memory = buildEditorialMemory({ projectId: input.projectId }, input.previousMemory);
  const plan = createEditorialPlan({ projectId: input.projectId, objective: input.objective, memory });
  return { normalized, segments, memory, plan };
}
