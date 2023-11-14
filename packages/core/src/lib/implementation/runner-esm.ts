import { EsmRunnerConfig } from '@code-pushup/models';
import { Observer, calcDuration } from '@code-pushup/utils';
import { RunnerResult } from './runner';

export async function executeEsmRunner(
  runner: EsmRunnerConfig,
  observer?: Observer,
): Promise<RunnerResult> {
  const date = new Date().toISOString();
  const start = performance.now();

  // execute plugin runner
  const audits = await runner(observer);

  // create runner result
  return {
    date,
    duration: calcDuration(start),
    audits,
  } satisfies RunnerResult;
}
