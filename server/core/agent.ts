import type { EditorialTask, TaskResult } from './domain';

export interface AgentDefinition {
  id: string;
  description: string;
  tokenBudget: number;
  execute: (task: EditorialTask) => Promise<TaskResult>;
}

export class AgentRegistry {
  private readonly agents = new Map<string, AgentDefinition>();

  register(agent: AgentDefinition): void { this.agents.set(agent.id, agent); }
  get(id: string): AgentDefinition | undefined { return this.agents.get(id); }
  has(id: string): boolean { return this.agents.has(id); }
  list(): AgentDefinition[] { return [...this.agents.values()]; }
}

export function createNoopAgent(id: string, description = 'Placeholder until a provider is configured.'): AgentDefinition {
  return {
    id,
    description,
    tokenBudget: 0,
    execute: async (task) => ({ taskId: task.id, status: 'failed', summary: 'Agent provider is not configured.', findings: [], changes: [], risks: ['agent_not_configured'] }),
  };
}
