import { type CliFlags, type RunnerResult } from 'lighthouse';
import { runLighthouse } from 'lighthouse/cli/run.js';
import { dirname } from 'node:path';
import {
  AuditOutputs,
  PluginConfig,
  RunnerFunction,
} from '@code-pushup/models';
import { ensureDirectoryExists, ui } from '@code-pushup/utils';
import {
  DEFAULT_CLI_FLAGS,
  LIGHTHOUSE_AUDITS,
  LIGHTHOUSE_GROUPS,
  LIGHTHOUSE_PLUGIN_SLUG,
} from './constants';
import {
  filterAuditsAndGroupsByOnlyOptions,
  getBudgets,
  getConfig,
  setLogLevel,
  toAuditOutputs,
  validateFlags,
} from './utils';

export type LighthouseCliFlags = Partial<
  Omit<CliFlags, 'enableErrorReporting'>
>;

// No error reporting implemented as in the source Sentry was involved
/*
if (cliFlags.enableErrorReporting) {
  await Sentry.init({
    url: urlUnderTest,
    flags: cliFlags,
    environmentData: {
      serverName: 'redacted', // prevent sentry from using hostname
      environment: isDev() ? 'development' : 'production',
      release: pkg.version,
    },
  });
 */
export function lighthousePlugin(
  url: string,
  flags?: LighthouseCliFlags,
): PluginConfig {
  const { audits, groups } = filterAuditsAndGroupsByOnlyOptions(
    LIGHTHOUSE_AUDITS,
    LIGHTHOUSE_GROUPS,
    flags,
  );
  return {
    slug: LIGHTHOUSE_PLUGIN_SLUG,
    title: 'Lighthouse',
    icon: 'lighthouse',
    audits,
    groups,
    runner: createRunnerFunction(url, flags),
  };
}

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
      ...parsedFlags
    } = validateFlags({
      ...DEFAULT_CLI_FLAGS,
      ...flags,
    });

    setLogLevel(parsedFlags);

    const config = await getConfig(parsedFlags);

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
