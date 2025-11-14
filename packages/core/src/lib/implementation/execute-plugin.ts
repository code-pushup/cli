import { bold } from 'ansis';
import {
  type AuditOutput,
  type AuditReport,
  type CacheConfigObject,
  DEFAULT_PERSIST_CONFIG,
  type PersistConfig,
  type PluginConfig,
  type PluginReport,
  type RunnerArgs,
} from '@code-pushup/models';
import {
  type ProgressBar,
  asyncSequential,
  getProgressBar,
  groupByStatus,
  logMultipleResults,
  pluralizeToken,
  scoreAuditsWithTarget,
  settlePromise,
  stringifyError,
} from '@code-pushup/utils';
import {
  executePluginRunner,
  readRunnerResults,
  writeRunnerResults,
} from './runner.js';

/**
 * Execute a plugin.
 *
 * @public
 * @param pluginConfig - {@link ProcessConfig} object with runner and meta
 * @param opt
 * @returns {Promise<AuditOutput[]>} - audit outputs from plugin runner
 * @throws {AuditOutputsMissingAuditError} - if plugin runner output is invalid
 *
 * @example
 * // plugin execution
 * const pluginCfg = validate(pluginConfigSchema, {...});
 * const output = await executePlugin(pluginCfg);
 *
 * @example
 * // error handling
 * try {
 *   await executePlugin(pluginCfg);
 * } catch (error) {
 *   console.error(error);
 * }
 */
export async function executePlugin(
  pluginConfig: PluginConfig,
  opt: {
    cache: CacheConfigObject;
    persist: PersistConfig;
  },
): Promise<PluginReport> {
  const {
    runner,
    audits: pluginConfigAudits,
    description,
    docsUrl,
    groups,
    scoreTargets,
    ...pluginMeta
  } = pluginConfig;
  const { write: cacheWrite = false, read: cacheRead = false } = opt.cache;

  const args: RunnerArgs = {
    persist: { ...DEFAULT_PERSIST_CONFIG, ...opt.persist },
  };
  const { outputDir } = args.persist;

  const { audits, ...executionMeta } = cacheRead
    ? // IF not null, take the result from cache
      ((await readRunnerResults(pluginMeta.slug, outputDir)) ??
      // ELSE execute the plugin runner
      (await executePluginRunner(pluginConfig, args)))
    : await executePluginRunner(pluginConfig, args);

  if (cacheWrite) {
    await writeRunnerResults(pluginMeta.slug, outputDir, {
      ...executionMeta,
      audits,
    });
  }

  // transform audit scores to 1 when they meet/exceed their targets
  const scoredAuditsWithTarget = scoreTargets
    ? scoreAuditsWithTarget(audits, scoreTargets)
    : audits;

  // enrich `AuditOutputs` to `AuditReport`
  const auditReports: AuditReport[] = scoredAuditsWithTarget.map(
    (auditOutput: AuditOutput) => ({
      ...auditOutput,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ...pluginConfigAudits.find(audit => audit.slug === auditOutput.slug)!,
    }),
  );

  // create plugin report
  return {
    ...pluginMeta,
    ...executionMeta,
    audits: auditReports,
    ...(description && { description }),
    ...(docsUrl && { docsUrl }),
    ...(groups && { groups }),
  };
}

const wrapProgress = async (
  cfg: {
    plugin: PluginConfig;
    persist: PersistConfig;
    cache: CacheConfigObject;
  },
  steps: number,
  progressBar: ProgressBar | null,
) => {
  const { plugin: pluginCfg, ...rest } = cfg;
  progressBar?.updateTitle(`Executing ${bold(pluginCfg.title)}`);
  try {
    const pluginReport = await executePlugin(pluginCfg, rest);
    progressBar?.incrementInSteps(steps);
    return pluginReport;
  } catch (error) {
    progressBar?.incrementInSteps(steps);
    throw new Error(
      `- Plugin ${bold(pluginCfg.title)} (${bold(
        pluginCfg.slug,
      )}) produced the following error:\n  - ${stringifyError(error)}`,
    );
  }
};

/**
 * Execute multiple plugins and aggregates their output.
 * @public
 * @param cfg
 * @param {Object} [options] execution options
 * @param {boolean} options.progress show progress bar
 * @returns {Promise<PluginReport[]>} plugin report
 *
 * @example
 * // plugin execution
 * const plugins = [validate(pluginConfigSchema, {...})];
 *
 * @example
 * // error handling
 * try {
 *   await executePlugins(plugins);
 * } catch (error) {
 *   console.error(error); // Plugin output is invalid
 * }
 *
 */
export async function executePlugins(
  cfg: {
    plugins: PluginConfig[];
    persist: PersistConfig;
    cache: CacheConfigObject;
  },
  options?: { progress?: boolean },
): Promise<PluginReport[]> {
  const { plugins, ...cacheCfg } = cfg;
  const { progress = false } = options ?? {};

  const progressBar = progress ? getProgressBar('Run plugins') : null;

  const pluginsResult = plugins.map(pluginCfg =>
    wrapProgress(
      { plugin: pluginCfg, ...cacheCfg },
      plugins.length,
      progressBar,
    ),
  );

  const errorsTransform = ({ reason }: PromiseRejectedResult) => String(reason);
  const results = await asyncSequential(pluginsResult, settlePromise);

  progressBar?.endProgress('Done running plugins');

  logMultipleResults(results, 'Plugins', undefined, errorsTransform);

  const { fulfilled, rejected } = groupByStatus(results);
  if (rejected.length > 0) {
    const errorMessages = rejected
      .map(({ reason }) => String(reason))
      .join('\n');
    throw new Error(
      `Executing ${pluralizeToken(
        'plugin',
        rejected.length,
      )} failed.\n\n${errorMessages}\n\n`,
    );
  }

  return fulfilled.map(result => result.value);
}
