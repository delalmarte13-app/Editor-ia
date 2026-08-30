import { describe, expect, it, vi } from 'vitest';
import { reviewAndRepair } from './review-loop';
import type { TaskResult } from './domain';

const bad: TaskResult = { taskId: 't1', status: 'failed', summary: '', findings: [], changes: [], risks: ['critical defect'] };
const good: TaskResult = { taskId: 't1', status: 'completed', summary: 'Reparado', findings: [], changes: ['fixed'], risks: [] };

describe('reviewAndRepair', () => {
  it('repairs until QA passes', async () => {
    const repair = vi.fn().mockResolvedValue(good);
    const result = await reviewAndRepair(bad, repair, 2);
    expect(result.report.approved).toBe(true);
    expect(result.repairs).toBe(1);
    expect(repair).toHaveBeenCalledTimes(1);
  });

  it('stops at the repair budget', async () => {
    const repair = vi.fn().mockResolvedValue(bad);
    const result = await reviewAndRepair(bad, repair, 2);
    expect(result.report.approved).toBe(false);
    expect(result.repairs).toBe(2);
    expect(repair).toHaveBeenCalledTimes(2);
  });
});
