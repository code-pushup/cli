import { AuditOutputs, EsmRunnerConfig } from '@code-pushup/models';
import { Observer, calcDuration } from '@code-pushup/utils';
import { RunnerResult } from './runner';

export function executeEsmRunner(
  runner: EsmRunnerConfig,
  observer?: Observer,
): Promise<RunnerResult> {
  const date = new Date().toISOString();
  const start = performance.now();

  return runner(observer).then((audits: AuditOutputs) => {
    const timings = { date, duration: calcDuration(start) };
    return { ...timings, audits };
  });
}
