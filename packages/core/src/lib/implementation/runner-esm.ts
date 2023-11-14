import {
  AuditOutputs,
  EsmObserver,
  EsmRunnerConfig,
} from '@code-pushup/models';
import { calcDuration } from '@code-pushup/utils';
import { RunnerResult } from './runner';

export type EsmRunnerProcessConfig = {
  runner: EsmRunnerConfig;
  observer?: EsmObserver;
};

export function runnerEsm(cfg: EsmRunnerProcessConfig): Promise<RunnerResult> {
  const { observer, runner } = cfg;
  const date = new Date().toISOString();
  const start = performance.now();

  return runner(observer).then((audits: AuditOutputs) => {
    const timings = { date, duration: calcDuration(start) };
    return { ...timings, audits };
  });
}
