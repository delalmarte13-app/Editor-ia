import { describe, expect, it } from 'vitest';
import { prepareEditorialRun } from './pipeline';

describe('prepareEditorialRun', () => {
  it('prepares a manuscript without an LLM call', () => {
    const result = prepareEditorialRun({ projectId: 'p1', text: 'Historia inicial.\n\nSegunda escena.', objective: 'Preparar edición' });
    expect(result.normalized.hash).toBeTruthy();
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.plan.tasks.length).toBeGreaterThan(0);
  });
});
