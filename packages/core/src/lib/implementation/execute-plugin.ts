import { bold } from 'ansis';
import type {
  Audit,
  AuditOutput,
  AuditReport,
  CacheConfig,
  PersistConfig,
  PluginConfig,
  PluginReport,
} from '@code-pushup/models';
import {
  type ProgressBar,
  getProgressBar,
  groupByStatus,
  logMultipleResults,
  pluralizeToken,
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
 * const pluginCfg = pluginConfigSchema.parse({...});
 * const output = await executePlugin(pluginCfg);
 *
 *  @example
 *  // error handling
 *  try {
 *  await executePlugin(pluginCfg);
 *  } catch (e) {
 *  console.error(e.message);
 *  }
 */
export async function executePlugin(
  pluginConfig: PluginConfig,
  opt: {
    cache?: CacheConfig;
    persist: Required<Pick<PersistConfig, 'outputDir'>>;
  },
): Promise<PluginReport> {
  const { cache, persist } = opt;
  const {
    runner,
    audits: pluginConfigAudits,
    description,
    docsUrl,
    groups,
    ...pluginMeta
  } = pluginConfig;
  const { write: cacheWrite = false, read: cacheRead = false } = cache ?? {};
  const { outputDir } = persist;

  const { audits, ...executionMeta } = cacheRead
    ? // IF not null, take the result from cache
      ((await readRunnerResults(pluginMeta.slug, outputDir)) ??
      // ELSE execute the plugin runner
      (await executePluginRunner(pluginConfig)))
    : await executePluginRunner(pluginConfig);

  if (cacheWrite) {
    await writeRunnerResults(pluginMeta.slug, outputDir, {
      ...executionMeta,
      audits,
    });
  }

  // enrich `AuditOutputs` to `AuditReport`
  const auditReports: AuditReport[] = audits.map(
    (auditOutput: AuditOutput) => ({
      ...auditOutput,
      ...(pluginConfigAudits.find(
        audit => audit.slug === auditOutput.slug,
      ) as Audit),
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
    persist: Required<Pick<PersistConfig, 'outputDir'>>;
    cache: CacheConfig;
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
      error instanceof Error
        ? `- Plugin ${bold(pluginCfg.title)} (${bold(
            pluginCfg.slug,
          )}) produced the following error:\n  - ${error.message}`
        : String(error),
    );
  }
};

/**
 * Execute multiple plugins and aggregates their output.
 * @public
 * @param plugins array of {@link PluginConfig} objects
 * @param {Object} [options] execution options
 * @param {boolean} options.progress show progress bar
 * @returns {Promise<PluginReport[]>} plugin report
 *
 * @example
 * // plugin execution
 * const plugins = [pluginConfigSchema.parse({...})];
 *
 * @example
 * // error handling
 * try {
 * await executePlugins(plugins);
 * } catch (e) {
 * console.error(e.message); // Plugin output is invalid
 * }
 *
 */
export async function executePlugins(
  cfg: {
    plugins: PluginConfig[];
    persist: Required<Pick<PersistConfig, 'outputDir'>>;
    cache: CacheConfig;
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
  const results = await Promise.allSettled(pluginsResult);

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
