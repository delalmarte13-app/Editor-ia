import { describe, expect, it } from 'vitest';
import { qualityGate } from './quality';

describe('qualityGate', () => {
  it('approves a complete safe result', () => {
    const report = qualityGate({ taskId: 't1', status: 'completed', summary: 'Resultado válido', findings: [], changes: [], risks: [] });
    expect(report.approved).toBe(true);
    expect(report.overallScore).toBe(100);
  });

  it('blocks incomplete or risky results', () => {
    const report = qualityGate({ taskId: 't1', status: 'failed', summary: '', findings: [], changes: [], risks: ['critical defect'] });
    expect(report.approved).toBe(false);
    expect(report.criticalFailures.length).toBeGreaterThan(0);
  });
});
