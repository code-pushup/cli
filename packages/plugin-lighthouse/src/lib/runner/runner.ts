import type { CliFlags, RunnerResult } from 'lighthouse';
import { runLighthouse } from 'lighthouse/cli/run.js';
import { dirname } from 'node:path';
import { AuditOutputs, RunnerFunction } from '@code-pushup/models';
import { ensureDirectoryExists, ui } from '@code-pushup/utils';
import { DEFAULT_CLI_FLAGS } from './constants';
import {
  getBudgets,
  getConfig,
  setLogLevel,
  toAuditOutputs,
  validateFlags,
} from './utils';

/**
 *
 * NOTICE:
 *
 * No error reporting implemented as in the source Sentry was involved
 * See: https://github.com/GoogleChrome/lighthouse/blob/d8ccf70692216b7fa047a4eaa2d1277b0b7fe947/cli/bin.js#L124
 */
export type LighthouseCliFlags = Partial<
  Omit<CliFlags, 'enableErrorReporting'>
>;

export function createRunnerFunction(
  urlUnderTest: string,
  flags: LighthouseCliFlags = {},
): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    const {
      precomputedLanternDataPath,
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

    const config = await getConfig({configPath, preset});

    const budgetsJson = budgetPath ? await getBudgets(budgetPath) : budgets;

    if (outputPath) {
      await ensureDirectoryExists(dirname(outputPath));
    }

    const flagsWithDefaults = {
      ...parsedFlags,
      budgets: budgetsJson,
      outputPath,
    };

    if (precomputedLanternDataPath) {
      ui().logger.info(
        `Parsing precomputedLanternDataPath "${precomputedLanternDataPath}" is skipped as not implemented.`,
      );
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
