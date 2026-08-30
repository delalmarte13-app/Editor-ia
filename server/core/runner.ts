import type { EditorialTask, TaskResult } from './domain';
import { ResultCache } from './cache';

export type TaskExecutor = (task: EditorialTask) => Promise<TaskResult>;

export class TaskRunner {
  private readonly cache = new ResultCache<TaskResult>();

  constructor(private readonly executor: TaskExecutor) {}

  async run(task: EditorialTask, completed: Set<string>): Promise<TaskResult> {
    if (task.dependencies.some((dependency) => !completed.has(dependency))) {
      return { taskId: task.id, status: 'failed', summary: 'Dependencies are not complete.', findings: ['blocked'], changes: [], risks: ['dependency_pending'] };
    }
    const cacheKey = `${task.id}:${task.attempt}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    const result = await this.executor(task);
    this.cache.set(cacheKey, result);
    return result;
  }

  async runPlan(tasks: EditorialTask[]): Promise<TaskResult[]> {
    const pending = new Map(tasks.map((task) => [task.id, task]));
    const completed = new Set<string>();
    const results: TaskResult[] = [];
    while (pending.size) {
      const ready = [...pending.values()].filter((task) => task.dependencies.every((dependency) => completed.has(dependency)));
      if (!ready.length) {
        for (const task of pending.values()) results.push({ taskId: task.id, status: 'failed', summary: 'Plan contains unresolved or circular dependencies.', findings: ['deadlock'], changes: [], risks: ['dependency_cycle'] });
        break;
      }
      const batch = await Promise.all(ready.map((task) => this.run(task, completed)));
      ready.forEach((task) => pending.delete(task.id));
      batch.forEach((result) => { results.push(result); if (result.status === 'completed') completed.add(result.taskId); });
    }
    return results;
  }
}
