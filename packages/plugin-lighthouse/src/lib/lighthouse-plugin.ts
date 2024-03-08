import {
  type Budget,
  type Config,
  type CliFlags as LighthouseFlags,
  type RunnerResult,
} from 'lighthouse';
import log from 'lighthouse-logger';
import { runLighthouse } from 'lighthouse/cli/run.js';
import path from 'node:path';
import {
  AuditOutputs,
  PluginConfig,
  RunnerFunction,
} from '@code-pushup/models';
import { importEsmModule, readJsonFile } from '@code-pushup/utils';
import {
  AUDITS,
  DEFAULT_CLI_FLAGS,
  GROUPS,
  LIGHTHOUSE_PLUGIN_SLUG,
} from './constants';
import { filterAuditsAndGroupsByOnlyOptions, toAuditOutputs } from './utils';

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
export function lighthousePlugin(url: string, flags: Flags): PluginConfig {
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

async function getConfig(
  flags: Pick<Flags, 'configPath' | 'preset'>,
): Promise<Config | undefined> {
  const { configPath: filepath, preset } = flags;

  if (filepath != null) {
    // Resolve the config file path relative to where cli was called.
    if (filepath.endsWith('.json')) {
      return readJsonFile<Config>(filepath);
    } else if (filepath.endsWith('.ts|.js|.mjs')) {
      return importEsmModule<Config>({ filepath });
    }
  } else if (preset) {
    return importEsmModule<Config>({
      filepath: `node_modules/lighthouse/core/config/${preset}-config.js`,
    });
  }
  return undefined;
}

export async function getBudgets(
  budgetPath?: string | null,
): Promise<Budget[] | null> {
  if (budgetPath) {
    /** @type {Array<LH.Budget>} */
    const parsedBudget = await readJsonFile<Budget>(
      path.resolve(process.cwd(), budgetPath),
    );

    return [parsedBudget];
  }
  return null;
}

export function setLogLevel({
  verbose,
  quiet,
}: {
  verbose?: boolean;
  quiet?: boolean;
}) {
  // set logging preferences
  if (verbose) {
    log.setLevel('verbose');
  } else if (quiet) {
    log.setLevel('silent');
  } else {
    log.setLevel('info');
  }
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
