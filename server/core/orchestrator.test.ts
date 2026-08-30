import { describe, expect, it, vi } from 'vitest';
import { TaskRunner } from './runner';
import type { EditorialTask } from './domain';

const task = (id: string, agent: string, dependencies: string[] = []): EditorialTask => ({ id, projectId: 'p1', agent, objective: agent, dependencies, status: 'pending', attempt: 0, maxAttempts: 2 });

describe('TaskRunner plan orchestration', () => {
  it('runs independent tasks in parallel and dependent tasks afterwards', async () => {
    const order: string[] = [];
    const executor = vi.fn(async (item: EditorialTask) => { order.push(`start:${item.id}`); await Promise.resolve(); order.push(`end:${item.id}`); return { taskId: item.id, status: 'completed' as const, summary: 'ok', findings: [], changes: [], risks: [] }; });
    const runner = new TaskRunner(executor);
    const results = await runner.runPlan([task('a', 'critic'), task('b', 'market'), task('c', 'qa', ['a', 'b'])]);
    expect(results.every((result) => result.status === 'completed')).toBe(true);
    expect(executor).toHaveBeenCalledTimes(3);
    expect(order.indexOf('end:b')).toBeLessThan(order.indexOf('start:c'));
    expect(order.indexOf('end:a')).toBeLessThan(order.indexOf('start:c'));
  });

  it('stops safely on circular dependencies', async () => {
    const executor = vi.fn();
    const runner = new TaskRunner(executor);
    const results = await runner.runPlan([task('a', 'critic', ['b']), task('b', 'qa', ['a'])]);
    expect(executor).not.toHaveBeenCalled();
    expect(results.every((result) => result.risks.includes('dependency_cycle'))).toBe(true);
  });
});
