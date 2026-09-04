export type EditorialDepartmentId =
  | 'director'
  | 'narrative'
  | 'editor'
  | 'continuity'
  | 'art'
  | 'production-kdp';

export interface EditorialDepartment {
  id: EditorialDepartmentId;
  label: string;
  promptPath: string;
  capabilities: string[];
  defaultTokenBudget: number;
}

/** Department prompts mirror the Gemini Gems used as specialized editorial engines. */
export const EDITORIAL_DEPARTMENTS: EditorialDepartment[] = [
  {
    id: 'director',
    label: 'Director Editorial',
    promptPath: 'prompts/gems/director.md',
    capabilities: ['planning', 'coordination', 'approval', 'project direction'],
    defaultTokenBudget: 1800,
  },
  {
    id: 'narrative',
    label: 'Narrativa',
    promptPath: 'prompts/gems/narrativa.md',
    capabilities: ['story creation', 'scenes', 'chapters', 'dialogue', 'voice'],
    defaultTokenBudget: 4000,
  },
  {
    id: 'editor',
    label: 'Edición Literaria',
    promptPath: 'prompts/gems/editor.md',
    capabilities: ['structural editing', 'rhythm', 'clarity', 'tone', 'dialogue'],
    defaultTokenBudget: 2600,
  },
  {
    id: 'continuity',
    label: 'Continuidad y Story Bible',
    promptPath: 'prompts/gems/continuidad.md',
    capabilities: ['canon', 'continuity', 'characters', 'chronology', 'world rules'],
    defaultTokenBudget: 2200,
  },
  {
    id: 'art',
    label: 'Dirección de Arte',
    promptPath: 'prompts/gems/arte.md',
    capabilities: ['visual identity', 'character sheets', 'scene prompts', 'covers'],
    defaultTokenBudget: 2400,
  },
  {
    id: 'production-kdp',
    label: 'Producción y KDP',
    promptPath: 'prompts/gems/produccion-kdp.md',
    capabilities: ['layout', 'metadata', 'KDP', 'print', 'digital', 'audiobook preparation'],
    defaultTokenBudget: 2200,
  },
];

export function getEditorialDepartment(id: EditorialDepartmentId): EditorialDepartment {
  const department = EDITORIAL_DEPARTMENTS.find((item) => item.id === id);
  if (!department) throw new Error(`Unknown editorial department: ${id}`);
  return department;
}
