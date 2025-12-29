import ansis from 'ansis';
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
  asyncSequential,
  logger,
  profiler,
  scoreAuditsWithTarget,
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

/**
 * Execute multiple plugins and aggregates their output.
 *
 * @param config
 * @returns plugin reports
 *
 * @example
 * try {
 *   await executePlugins(config);
 * } catch (error) {
 *   console.error(error); // Plugin output is invalid
 * }
 */
export function executePlugins(config: {
  plugins: PluginConfig[];
  persist: PersistConfig;
  cache: CacheConfigObject;
}): Promise<PluginReport[]> {
  return profiler.spanAsync(
    'executePlugins',
    async () => {
      return asyncSequential(config.plugins, async (pluginConfig, index) => {
        const suffix = ansis.gray(`[${index + 1}/${config.plugins.length}]`);
        const title = `Running plugin "${pluginConfig.title}" ${suffix}`;
        const message = `Completed "${pluginConfig.title}" plugin execution`;
        return logger.group(title, async () => {
          const result = await executePlugin(pluginConfig, config);
          return { message, result };
        });
      });
    },
    { detail: profiler.spans.cli() },
  );
}
