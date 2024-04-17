import type { RunnerResult } from 'lighthouse';
import { runLighthouse } from 'lighthouse/cli/run.js';
import { dirname } from 'node:path';
import { AuditOutputs, RunnerFunction } from '@code-pushup/models';
import { ensureDirectoryExists } from '@code-pushup/utils';
import { DEFAULT_CLI_FLAGS } from './constants';
import { LighthouseCliFlags } from './types';
import {
  getBudgets,
  getConfig,
  normalizeAuditOutputs,
  setLogLevel,
  toAuditOutputs,
} from './utils';

export function createRunnerFunction(
  urlUnderTest: string,
  flags: LighthouseCliFlags = DEFAULT_CLI_FLAGS,
): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    const {
      configPath,
      preset,
      budgetPath,
      budgets,
      outputPath,
      ...parsedFlags
    }: Partial<LighthouseCliFlags> = flags;

    setLogLevel(parsedFlags);

    const config = await getConfig({ configPath, preset });
    const budgetsJson = budgetPath ? await getBudgets(budgetPath) : budgets;
    if (typeof outputPath === 'string') {
      await ensureDirectoryExists(dirname(outputPath));
    }

    const enrichedFlags = {
      ...parsedFlags,
      outputPath,
      budgets: budgetsJson,
    };

    const runnerResult: unknown = await runLighthouse(
      urlUnderTest,
      enrichedFlags,
      config,
    );

    if (runnerResult == null) {
      throw new Error('Lighthouse did not produce a result.');
    }

    const { lhr } = runnerResult as RunnerResult;
    const auditOutputs = toAuditOutputs(Object.values(lhr.audits), flags);

    return normalizeAuditOutputs(auditOutputs, enrichedFlags);
  };
}
