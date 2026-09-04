import type { EditorialMemory, EditorialTask } from './domain.js';
import { departmentForAgent } from './department-router.js';

export interface PlanningInput {
  projectId: string;
  objective: string;
  memory?: EditorialMemory;
  availableAgents?: string[];
  maxTasks?: number;
}

export interface EditorialPlan {
  objective: string;
  tasks: EditorialTask[];
  estimatedTokenBudget: number;
}

const DEFAULT_AGENTS = ['analyst', 'corrector', 'critic', 'rewriter', 'qa'];

/** Deterministic baseline planner. LLM delegation is intentionally deferred until needed. */
export function createEditorialPlan(input: PlanningInput): EditorialPlan {
  const agents = input.availableAgents?.length ? input.availableAgents : DEFAULT_AGENTS;
  const maxTasks = Math.max(1, input.maxTasks ?? agents.length);
  const selected = agents.slice(0, maxTasks);
  const tasks: EditorialTask[] = selected.map((agent, index) => ({
    id: `task-${index + 1}-${agent}`,
    projectId: input.projectId,
    agent,
    department: departmentForAgent(agent),
    objective: input.objective,
    inputContext: input.memory?.summary || undefined,
    dependencies: agent === 'qa' ? selected.filter((a) => a !== 'qa').map((a) => `task-${selected.indexOf(a) + 1}-${a}`) : [],
    status: 'pending',
    attempt: 0,
    maxAttempts: 2,
  }));

  return { objective: input.objective, tasks, estimatedTokenBudget: selected.length * 1200 };
}
