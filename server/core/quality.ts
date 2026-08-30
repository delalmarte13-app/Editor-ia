import type { QualityReport, TaskResult } from './domain';

export interface QualityCriterion {
  name: string;
  check: (result: TaskResult) => boolean;
  score: number;
}

const defaultCriteria: QualityCriterion[] = [
  { name: 'has_summary', check: (r) => Boolean(r.summary.trim()), score: 25 },
  { name: 'no_critical_risk', check: (r) => !r.risks.some((risk) => /critical|fatal/i.test(risk)), score: 25 },
  { name: 'has_status', check: (r) => r.status === 'completed', score: 25 },
  { name: 'structured_findings', check: (r) => Array.isArray(r.findings), score: 25 },
];

/** Cheap deterministic gate; semantic AI review can be layered later. */
export function qualityGate(result: TaskResult, criteria = defaultCriteria): QualityReport {
  const evaluated = criteria.map((criterion) => ({ name: criterion.name, score: criterion.check(result) ? criterion.score : 0, passed: criterion.check(result) }));
  const overallScore = evaluated.reduce((sum, item) => sum + item.score, 0);
  const criticalFailures = evaluated.filter((item) => !item.passed).map((item) => item.name);
  return {
    taskId: result.taskId,
    approved: criticalFailures.length === 0,
    overallScore,
    criteria: evaluated,
    criticalFailures,
    repairInstructions: criticalFailures.map((failure) => `Repair criterion: ${failure}`),
  };
}
