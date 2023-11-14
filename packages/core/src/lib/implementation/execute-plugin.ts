import chalk from 'chalk';
import { join } from 'path';
import {
  Audit,
  AuditOutput,
  AuditOutputs,
  AuditReport,
  PluginConfig,
  PluginReport,
  auditOutputsSchema,
} from '@code-pushup/models';
import {
  ProcessObserver,
  executeProcess,
  getProgressBar,
  readJsonFile,
} from '@code-pushup/utils';

/**
 * Error thrown when plugin output is invalid.
 */
export class PluginOutputMissingAuditError extends Error {
  constructor(auditSlug: string) {
    super(`Audit metadata not found for slug ${auditSlug}`);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    runner: onlyUsedForRestingPluginMeta,
    audits: pluginConfigAudits,
    description,
    docsUrl,
    groups,
    ...pluginMeta
  } = pluginConfig;
  const { args, command } = pluginConfig.runner;

  const { date, duration } = await executeProcess({
    command,
    args,
    observer,
  });
  const executionMeta = { date, duration };

  const processOutputPath = join(process.cwd(), pluginConfig.runner.outputFile);

  // read process output from file system and parse it
  let unknownAuditOutputs = await readJsonFile<Record<string, unknown>[]>(
    processOutputPath,
  );

  // parse transform unknownAuditOutputs to auditOutputs
  if (pluginConfig.runner?.outputTransform) {
    unknownAuditOutputs = await pluginConfig.runner.outputTransform(
      unknownAuditOutputs,
    );
  }

  // validate audit outputs
  const auditOutputs = auditOutputsSchema.parse(unknownAuditOutputs);

  // validate auditOutputs
  auditOutputsCorrelateWithPluginOutput(auditOutputs, pluginConfigAudits);

  // enrich `AuditOutputs` to `AuditReport`
  const audits: AuditReport[] = auditOutputs.map(
    (auditOutput: AuditOutput) => ({
      ...auditOutput,
      ...(pluginConfigAudits.find(
        audit => audit.slug === auditOutput.slug,
      ) as Audit),
    }),
  );

  return {
    ...pluginMeta,
    ...executionMeta,
    audits,
    ...(description && { description }),
    ...(docsUrl && { docsUrl }),
    ...(groups && { groups }),
  } satisfies PluginReport;
}

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
 * console.log(e.message); // Plugin output is invalid
 * }
 *
 */
export async function executePlugins(
  plugins: PluginConfig[],
  options?: { progress: boolean },
): Promise<PluginReport[]> {
  const { progress = false } = options || {};

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

function auditOutputsCorrelateWithPluginOutput(
  auditOutputs: AuditOutputs,
  pluginConfigAudits: PluginConfig['audits'],
) {
  auditOutputs.forEach(auditOutput => {
    const auditMetadata = pluginConfigAudits.find(
      audit => audit.slug === auditOutput.slug,
    );
    if (!auditMetadata) {
      throw new PluginOutputMissingAuditError(auditOutput.slug);
    }
  });
}
