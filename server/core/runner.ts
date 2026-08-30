import type { EditorialTask, TaskResult } from './domain';
import { ResultCache } from './cache';

export type TaskExecutor = (task: EditorialTask) => Promise<TaskResult>;

export class TaskRunner {
  private readonly cache = new ResultCache<TaskResult>();

  constructor(private readonly executor: TaskExecutor) {}

  async run(task: EditorialTask, completed: Set<string>): Promise<TaskResult> {
    const blocked = task.dependencies.some((dependency) => !completed.has(dependency));
    if (blocked) {
      return { taskId: task.id, status: 'failed', summary: 'Dependencies are not complete.', findings: ['blocked'], changes: [], risks: ['dependency_pending'] };
    }

    const cacheKey = `${task.id}:${task.attempt}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result = await this.executor(task);
    this.cache.set(cacheKey, result);
    return result;
  }
}
