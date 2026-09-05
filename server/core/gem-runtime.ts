import fs from 'node:fs/promises';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import type { EditorialDepartmentId } from './departments.js';

const GEM_PROMPTS: Record<EditorialDepartmentId, string> = {
  director: 'director.md',
  narrative: 'narrativa.md',
  editor: 'editor.md',
  continuity: 'continuidad.md',
  art: 'arte.md',
  'production-kdp': 'produccion-kdp.md',
};

export interface GemExecutionInput {
  department: EditorialDepartmentId;
  task: string;
  projectContext?: string;
  storyBible?: string;
  currentUnit?: string;
  previousApproved?: string;
  model?: string;
  thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high';
}

export interface GemExecutionResult {
  department: EditorialDepartmentId;
  model: string;
  output: string;
  interactionId?: string;
}

function promptsRoot(): string {
  return path.resolve(process.cwd(), 'prompts', 'gems');
}

export async function loadGemPrompt(department: EditorialDepartmentId): Promise<string> {
  const filename = GEM_PROMPTS[department];
  return fs.readFile(path.join(promptsRoot(), filename), 'utf8');
}

function buildInput(input: GemExecutionInput): string {
  const sections = [
    'EDITOR-IA TASK',
    input.task,
    'PROJECT CONTEXT',
    input.projectContext || '(not provided)',
    'APPROVED STORY BIBLE',
    input.storyBible || '(not provided)',
    'CURRENT PRODUCTION UNIT',
    input.currentUnit || '(not provided)',
    'PREVIOUS APPROVED MATERIAL',
    input.previousApproved || '(not provided)',
    'EXECUTION RULE',
    'Work only on the assigned task. Preserve approved canon. Return a production-ready result or a concise blocking issue if the supplied context is insufficient.',
  ];
  return sections.join('\n\n');
}

export async function executeGem(input: GemExecutionInput): Promise<GemExecutionResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');

  const prompt = await loadGemPrompt(input.department);
  const model = input.model || process.env.GEMINI_MODEL || 'gemini-3.7-flash';
  const client = new GoogleGenAI({ apiKey });

  const interaction = await client.interactions.create({
    model,
    input: buildInput(input),
    system_instruction: prompt,
    store: false,
    generation_config: {
      thinking_level: input.thinkingLevel || 'low',
    },
  });

  return {
    department: input.department,
    model,
    output: interaction.output_text || '',
    interactionId: interaction.id,
  };
}

export function gemPromptFilename(department: EditorialDepartmentId): string {
  return GEM_PROMPTS[department];
}
