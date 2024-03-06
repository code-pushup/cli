import {
  type Budget,
  type CliFlags as LighthouseFlags,
  type Config,
  type PrecomputedLanternData,
  type RunnerResult,
  defaultConfig
} from 'lighthouse';
import {AuditOutputs, PluginConfig, RunnerFunction} from '@code-pushup/models';
import {AUDITS, GROUPS, LIGHTHOUSE_PLUGIN_SLUG, LIGHTHOUSE_REPORT_NAME} from './constants';
import {filterAuditsAndGroupsByOnlyOptions, toAuditOutputs} from './utils';
import {runLighthouse} from 'lighthouse/cli/run.js';
import path from "path";
import log from "lighthouse-logger";
import {importEsmModule, readJsonFile} from "@code-pushup/utils";

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
export function lighthousePlugin(
  url: string,
  flags: Flags
): PluginConfig {
  const {audits, groups} = filterAuditsAndGroupsByOnlyOptions(
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

async function getConfig(flags: Pick<Flags, 'configPath' | 'preset'>): Promise<Config> {
  const {configPath} = flags;

  if (configPath != null) {
    // Resolve the config file path relative to where cli was called.
    if (configPath.endsWith('.json')) {
      return readJsonFile<Config>(configPath);
    } else if (configPath.endsWith('.ts|.js|.mjs')) {
      return importEsmModule<Config>({filepath: configPath});
    }
  } else if (flags.preset) {
    return importEsmModule<Config>({filepath: `node_modules/lighthouse/core/config/${flags.preset}-config.js`});
  }
  return {extends: 'default'};
}

export async function getBudgets(budgetPath?: string | null): Promise<Budget[] | null> {
  if (budgetPath) {
    /** @type {Array<LH.Budget>} */
    const parsedBudget = await readJsonFile<Budget>(path.resolve(process.cwd(), budgetPath));
    // eslint-disable-next-line functional/immutable-data,no-param-reassign
    return [parsedBudget];
  }
  return null;
}

export function getRunner(targetUrl: string,
                          flags: Flags): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    const urlUnderTest = targetUrl;
    // eslint-disable-next-line functional/no-let
    let {
      logLevel = 'info',
    } = flags;
    const {
      verbose = false,
      quiet = false
    } = flags;
    // set logging preferences
    if (verbose) {
      logLevel = 'verbose';
    } else if (quiet) {
      logLevel = 'silent';
    }
    log.setLevel(logLevel);

    const {budgetPath, budgets = [], ...restFlags} = flags;

    const config = getConfig(flags);
    const budgetsJson = budgetPath ? await getBudgets(budgetPath) : budgets;

    // Logging
    let flagsWithDefaults = {
      'save-assets': true,
      'list-all-audits': false,
      'list-locales': false,
      'list-trace-categories': false,
      port: 0,
      hostname: '127.0.0.1',
      view: false,
      channel: 'cli',
      'chrome-ignore-default-flags': false,
      //
      verbose,
      quiet,
      logLevel,
      enableErrorReporting: false,
      output: 'json',
      outputPath: LIGHTHOUSE_REPORT_NAME,
      budgets: budgetsJson,
      ...restFlags,
    }

    // eslint-disable-next-line functional/no-let
    if (flags.precomputedLanternDataPath) {
      const data = await readJsonFile<Partial<PrecomputedLanternData>>(flags.precomputedLanternDataPath);
      /** @type {LH.PrecomputedLanternData} */
      if (!data.additionalRttByOrigin || !data.serverResponseTimeByOrigin) {
        throw new Error('Invalid precomputed lantern data file');
      }
      flagsWithDefaults = {
        ...flagsWithDefaults,
        precomputedLanternData: data as PrecomputedLanternData
      }
    }

    const runnerResult: unknown = await runLighthouse(urlUnderTest, flagsWithDefaults, config);

    if (runnerResult == null) {
      throw new Error('Lighthouse did not produce a result.');
    }
    const {lhr} = runnerResult as RunnerResult;
    return toAuditOutputs(Object.values(lhr.audits));
  }
}
