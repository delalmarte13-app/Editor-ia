import type { QualityReport, TaskResult } from './domain';
import { qualityGate } from './quality';

export interface RepairExecutor {
  (result: TaskResult, report: QualityReport): Promise<TaskResult>;
}

export interface ReviewLoopResult {
  result: TaskResult;
  report: QualityReport;
  repairs: number;
}

/** Bounded QA -> repair -> QA loop. Prevents uncontrolled token-consuming retries. */
export async function reviewAndRepair(
  initial: TaskResult,
  repair: RepairExecutor,
  maxRepairs = 2,
): Promise<ReviewLoopResult> {
  let result = initial;
  let report = qualityGate(result);
  let repairs = 0;

  while (!report.approved && repairs < Math.max(0, maxRepairs)) {
    result = await repair(result, report);
    repairs += 1;
    report = qualityGate(result);
  }

  return { result, report, repairs };
}
