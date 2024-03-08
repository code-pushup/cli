import {
  type CliFlags as LighthouseFlags,
  type RunnerResult,
} from 'lighthouse';
import { runLighthouse } from 'lighthouse/cli/run.js';
import {
  AuditOutputs,
  PluginConfig,
  RunnerFunction,
} from '@code-pushup/models';
import {
  AUDITS,
  DEFAULT_CLI_FLAGS,
  GROUPS,
  LIGHTHOUSE_PLUGIN_SLUG,
} from './constants';
import {
  filterAuditsAndGroupsByOnlyOptions,
  getBudgets,
  getConfig,
  setLogLevel,
  toAuditOutputs,
} from './utils';

export type Flags = Partial<Omit<LighthouseFlags, 'enableErrorReporting'>>;

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
export function lighthousePlugin(url: string, flags?: Flags): PluginConfig {
  const { audits, groups } = filterAuditsAndGroupsByOnlyOptions(
    AUDITS,
    GROUPS,
    flags,
  );
  return {
    slug: LIGHTHOUSE_PLUGIN_SLUG,
    title: 'Lighthouse',
    icon: 'lighthouse',
    audits,
    groups,
    runner: getRunner(url, flags),
  };
}

export function getRunner(
  urlUnderTest: string,
  flags: Flags = {},
): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    const {
      precomputedLanternDataPath,
      budgetPath,
      budgets = [],
      ...parsedFlags
    } = {
      ...DEFAULT_CLI_FLAGS,
      ...flags,
    };

    setLogLevel(parsedFlags);

    const config = await getConfig(parsedFlags);

    const budgetsJson = budgetPath ? await getBudgets(budgetPath) : budgets;

    const flagsWithDefaults = {
      ...parsedFlags,
      budgets: budgetsJson,
    };

    if (precomputedLanternDataPath) {
      // eslint-disable-next-line no-console
      console.log(
        `The parsing precomputedLanternDataPath ${precomputedLanternDataPath} is skipped as not implemented.`,
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
