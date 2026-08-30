import type { EditorialTask, TaskResult } from './domain';
import { AgentRegistry } from './agent';
import { TaskRunner } from './runner';
import { reviewAndRepair } from './review-loop';

export interface AgentPipelineResult {
  results: TaskResult[];
  approved: boolean;
  repaired: number;
}

/** Executes agents, then applies bounded QA only when a result actually fails. */
export async function executeEditorialPlan(registry: AgentRegistry, tasks: EditorialTask[]): Promise<AgentPipelineResult> {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  let repaired = 0;
  const runner = new TaskRunner(async (task) => {
    const agent = registry.get(task.agent);
    if (!agent) return { taskId: task.id, status: 'failed', summary: 'Unknown agent.', findings: [], changes: [], risks: ['agent_unknown'] };
    return agent.execute(task);
  });

  const rawResults = await runner.runPlan(tasks);
  const reviewed = await Promise.all(rawResults.map(async (result) => {
    const task = byId.get(result.taskId);
    const agent = task ? registry.get(task.agent) : undefined;
    const review = await reviewAndRepair(
      result,
      async () => {
        if (!agent || !task) return result;
        return agent.execute({ ...task, attempt: Math.min(task.attempt + 1, task.maxAttempts) });
      },
      Math.max(0, task ? task.maxAttempts - task.attempt : 0),
    );
    repaired += review.repairs;
    return review;
  }));

  return {
    results: reviewed.map((item) => item.result),
    approved: reviewed.every((item) => item.report.approved),
    repaired,
  };
}
