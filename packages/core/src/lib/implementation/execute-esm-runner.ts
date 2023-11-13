import {
  EsmObserver,
  EsmRunnerConfig,
  RunnerResult,
  runnerResultSchema,
} from '@code-pushup/models';
import { calcDuration } from '@code-pushup/utils';

export type EsmRunnerProcessConfig = {
  runner: EsmRunnerConfig;
  observer?: EsmObserver;
};

export function executeEsmRunner(
  cfg: EsmRunnerProcessConfig,
): Promise<RunnerResult> {
  const { observer, runner } = cfg;
  const date = new Date().toISOString();
  const start = performance.now();

  return runner(observer).then(result => {
    const timings = { date, duration: calcDuration(start) };
    return runnerResultSchema.parse({ result, ...timings });
  });
}


