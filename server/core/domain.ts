import type { EditorialDepartmentId } from './departments.js';

export type TaskStatus = 'pending' | 'ready' | 'running' | 'waiting' | 'qa' | 'repair' | 'completed' | 'failed' | 'cancelled';

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Manuscript {
  id: string;
  projectId: string;
  versionId: string;
  text: string;
  language?: string;
  wordCount: number;
  characterCount: number;
  hash: string;
}

export interface DocumentVersion {
  id: string;
  manuscriptId: string;
  text: string;
  hash: string;
  createdAt: string;
}

export interface EditorialMemory {
  projectId: string;
  summary: string;
  facts: string[];
  characters: string[];
  places: string[];
  decisions: string[];
  openIssues: string[];
  updatedAt: string;
}

export interface EditorialTask {
  id: string;
  projectId: string;
  agent: string;
  department?: EditorialDepartmentId;
  objective: string;
  inputContext?: string;
  dependencies: string[];
  status: TaskStatus;
  attempt: number;
  maxAttempts: number;
}

export interface TaskResult {
  taskId: string;
  status: 'completed' | 'failed';
  score?: number;
  summary: string;
  findings: string[];
  changes: string[];
  risks: string[];
  output?: unknown;
}

export interface QualityReport {
  taskId: string;
  approved: boolean;
  overallScore: number;
  criteria: Array<{ name: string; score: number; passed: boolean }>;
  criticalFailures: string[];
  repairInstructions: string[];
}

export interface Deliverable {
  id: string;
  projectId: string;
  type: string;
  name: string;
  content: string;
}
