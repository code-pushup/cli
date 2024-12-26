import { LinterOptions } from 'stylelint';
import type { RunnerFunction } from '@code-pushup/models';
import { lintStyles } from './stylelint-runner.js';
import { mapStylelintResultsToAudits } from './utils';

export function createRunnerFunction(opt: LinterOptions): RunnerFunction {
  return async () => {
    const report = await lintStyles(opt);
    return mapStylelintResultsToAudits(report);
  };
}
