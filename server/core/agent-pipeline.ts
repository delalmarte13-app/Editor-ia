import type { EditorialTask, TaskResult } from './domain';
import { AgentRegistry } from './agent';
import { TaskRunner } from './runner';
import { reviewAndRepair } from './review-loop';

export interface AgentPipelineResult {
  results: TaskResult[];
  approved: boolean;
  repaired: number;
}

/** Executes registered agents and applies the bounded independent quality loop. */
export async function executeEditorialPlan(registry: AgentRegistry, tasks: EditorialTask[]): Promise<AgentPipelineResult> {
  let repaired = 0;
  const runner = new TaskRunner(async (task) => {
    const agent = registry.get(task.agent);
    if (!agent) return { taskId: task.id, status: 'failed', summary: 'Unknown agent.', findings: [], changes: [], risks: ['agent_unknown'] };
    return agent.execute(task);
  });

  const rawResults = await runner.runPlan(tasks);
  const reviewed = await Promise.all(rawResults.map(async (result) => {
    const agent = registry.get(tasks.find((task) => task.id === result.taskId)?.agent ?? '');
    if (!agent || result.status === 'completed') {
      const review = await reviewAndRepair(result, async (current) => current, 0);
      return review;
    }
    const review = await reviewAndRepair(result, async (current) => agent.execute({ ...tasks.find((task) => task.id === result.taskId)!, attempt: current.taskId === result.taskId ? 1 : 0 }), 2);
    repaired += review.repairs;
    return review;
  }));

  return { results: reviewed.map((item) => item.result), approved: reviewed.every((item) => item.report.approved), repaired };
}
