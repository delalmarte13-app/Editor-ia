import { describe, expect, it } from 'vitest';
import { createEditorialPlan } from './planner.js';

describe('createEditorialPlan', () => {
  it('creates bounded tasks, routes departments, and makes QA depend on specialists', () => {
    const plan = createEditorialPlan({ projectId: 'p1', objective: 'Mejorar la novela', maxTasks: 3 });
    expect(plan.tasks).toHaveLength(3);
    expect(plan.tasks[0].department).toBe('director');
    expect(plan.tasks[1].department).toBe('editor');
    expect(plan.tasks[2].department).toBe('editor');
    const qa = plan.tasks.find((task) => task.agent === 'qa');
    expect(qa?.dependencies).toEqual(['task-1-analyst', 'task-2-corrector']);
  });

  it('uses compact memory context instead of the full manuscript', () => {
    const plan = createEditorialPlan({ projectId: 'p1', objective: 'Analizar', memory: { projectId: 'p1', summary: 'Resumen breve', facts: [], characters: [], places: [], decisions: [], openIssues: [], updatedAt: '' }, availableAgents: ['critic'] });
    expect(plan.tasks[0].inputContext).toBe('Resumen breve');
  });
});
