import chalk from 'chalk';
import {
  AuditOutput,
  auditOutputsSchema,
  AuditReport, EsmObserver, EsmRunnerConfig,
  PluginConfig,
  PluginReport,
  RunnerResult
} from '@code-pushup/models';
import {getProgressBar, ProcessObserver,} from '@code-pushup/utils';
import {executeEsmRunner} from "./execute-esm-runner";
import {executeRunner} from "./execute-runner";

/**
 * Error thrown when plugin output is invalid.
 */
export class PluginOutputMissingAuditError extends Error {
  constructor(auditSlug: string, pluginSlug: string) {
    super(`Audit metadata not found for slug ${auditSlug} from plugin ${pluginSlug}`);
  }
}

/**
 * Execute a plugin.
 *
 * @public
 * @param pluginConfig - {@link ProcessConfig} object with runner and meta
 * @param observer - process {@link ProcessObserver}
 * @returns {Promise<AuditOutput[]>} - audit outputs from plugin runner
 * @throws {PluginOutputMissingAuditError} - if plugin runner output is invalid
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
 *  console.log(e.message);
 *  }
 */
export async function executePlugin(
  pluginConfig: PluginConfig,
  observer?: ProcessObserver,
): Promise<PluginReport> {
  const {
    audits: _,
    description,
    docsUrl,
    groups,
    ...pluginMeta
  } = pluginConfig;
  let runnerResult: RunnerResult;

  if (typeof pluginConfig?.es5Runner === 'function') {
    runnerResult = await executeEsmRunner({
      runner: pluginConfig?.es5Runner
    })
  } else {
    runnerResult = await executeRunner(pluginConfig.runner);
  }

  const {audits: runnerAuditOutputs, ...executionMeta} = runnerResult;
  // read process output from file system and parse it
  let auditOutputs = auditOutputsSchema.parse(runnerAuditOutputs);
  const audits = auditOutputs.map(auditOutput => {
    const auditMetadata = pluginConfig.audits.find(
      audit => audit.slug === auditOutput.slug,
    );
    if (!auditMetadata) {
      throw new PluginOutputMissingAuditError(
        auditOutput.slug, pluginMeta.slug
      );
    }
    return {
      ...auditOutput,
      ...auditMetadata,
    } satisfies AuditReport;
  });

  return {
    ...pluginMeta,
    ...executionMeta,
    audits,
    ...(description && {description}),
    ...(docsUrl && {docsUrl}),
    ...(groups && {groups}),
  } satisfies PluginReport;

}

export async function executePlugins(
  plugins: PluginConfig[],
  options?: { progress: boolean },
): Promise<PluginReport[]> {
  const {progress = false} = options || {};

  const progressName = 'Run Plugins';
  const progressBar = progress ? getProgressBar(progressName) : null;

  const pluginsResult = await plugins.reduce(async (acc, pluginCfg) => {
    const outputs = await acc;

    progressBar?.updateTitle(`Executing  ${chalk.bold(pluginCfg.title)}`);

    const pluginReport = await executePlugin(pluginCfg);
    progressBar?.incrementInSteps(plugins.length);

    return outputs.concat(pluginReport);
  }, Promise.resolve([] as PluginReport[]));

  progressBar?.endProgress('Done running plugins');

  return pluginsResult;
}
