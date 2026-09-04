import type { EditorialTask } from './domain.js';
import type { EditorialDepartmentId } from './departments.js';

const AGENT_TO_DEPARTMENT: Record<string, EditorialDepartmentId> = {
  analyst: 'director',
  critic: 'editor',
  rewriter: 'narrative',
  corrector: 'editor',
  qa: 'continuity',
};

/** Routes legacy/internal agent ids to the department Gem responsible for the work. */
export function departmentForAgent(agent: string): EditorialDepartmentId | undefined {
  return AGENT_TO_DEPARTMENT[agent];
}

export function departmentForTask(task: Pick<EditorialTask, 'agent' | 'department'>): EditorialDepartmentId | undefined {
  return task.department ?? departmentForAgent(task.agent);
}

export function isCreativeDepartment(id: EditorialDepartmentId): boolean {
  return id === 'narrative' || id === 'art';
}
