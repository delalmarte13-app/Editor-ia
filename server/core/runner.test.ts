import { describe, expect, it, vi } from 'vitest';
import { TaskRunner } from './runner';
import type { EditorialTask } from './domain';

const task: EditorialTask = { id: 't1', projectId: 'p1', agent: 'critic', objective: 'Analizar', dependencies: [], status: 'pending', attempt: 0, maxAttempts: 2 };

describe('TaskRunner', () => {
  it('executes a task once and caches the result', async () => {
    const executor = vi.fn().mockResolvedValue({ taskId: 't1', status: 'completed', summary: 'ok', findings: [], changes: [], risks: [] });
    const runner = new TaskRunner(executor);
    const completed = new Set<string>();
    await runner.run(task, completed);
    await runner.run(task, completed);
    expect(executor).toHaveBeenCalledTimes(1);
  });

  it('does not execute when dependencies are missing', async () => {
    const executor = vi.fn();
    const runner = new TaskRunner(executor);
    const blocked = { ...task, dependencies: ['other'] };
    const result = await runner.run(blocked, new Set());
    expect(result.status).toBe('failed');
    expect(executor).not.toHaveBeenCalled();
  });
});
