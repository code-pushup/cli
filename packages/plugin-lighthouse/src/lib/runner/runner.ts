import type { CliFlags, RunnerResult } from 'lighthouse';
import { runLighthouse } from 'lighthouse/cli/run.js';
import { dirname } from 'node:path';
import { AuditOutputs, RunnerFunction } from '@code-pushup/models';
import { ensureDirectoryExists } from '@code-pushup/utils';
import { UnsupportedCliFlags } from '../constants';
import { DEFAULT_CLI_FLAGS } from './constants';
import {
  getBudgets,
  getConfig,
  setLogLevel,
  toAuditOutputs,
  validateFlags,
} from './utils';

export type LighthouseCliFlags = Partial<Omit<CliFlags, UnsupportedCliFlags>>;

export function createRunnerFunction(
  urlUnderTest: string,
  flags: LighthouseCliFlags = {},
): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    const {
      budgetPath,
      budgets = [],
      outputPath,
      configPath,
      preset,
      ...parsedFlags
    } = validateFlags({
      ...DEFAULT_CLI_FLAGS,
      ...flags,
    });

    setLogLevel(parsedFlags);

    const config = await getConfig({ configPath, preset });
    const budgetsJson = budgetPath ? await getBudgets(budgetPath) : budgets;

    const flagsWithDefaults = {
      ...parsedFlags,
      budgets: budgetsJson,
      outputPath,
    };

    if (outputPath) {
      await ensureDirectoryExists(dirname(outputPath));
    }

    const runnerResult: unknown = await runLighthouse(
      urlUnderTest,
      flagsWithDefaults,
      config,
    );

    if (runnerResult == null) {
      throw new Error('Lighthouse did not produce a result.');
    }

    const { lhr } = runnerResult as RunnerResult;
    return toAuditOutputs(Object.values(lhr.audits));
  };
}
