import chalk from 'chalk';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  PluginConfig,
  PluginReport,
  auditOutputsSchema,
} from '@code-pushup/models';
import {
  ProcessObserver,
  ProgressBar,
  executeProcess,
  getProgressBar,
} from '@code-pushup/utils';

/**
 * Error thrown when plugin output is invalid.
 */
export class PluginOutputError extends Error {
  constructor(pluginSlug: string, error?: Error) {
    super(
      `Plugin output of plugin with slug ${pluginSlug} is invalid. \n Error: ${error?.message}`,
    );
    if (error) {
      this.name = error.name;
      this.stack = error.stack;
    }
  }
}

/**
 * Execute a plugin.
 *
 * @public
 * @param pluginConfig - {@link ProcessConfig} object with runner and meta
 * @param observer - process {@link ProcessObserver}
 * @returns {Promise<AuditOutput[]>} - audit outputs from plugin runner
 * @throws {PluginOutputError} - if plugin runner output is invalid
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
    slug,
    title,
    icon,
    description,
    docsUrl,
    version,
    packageName,
    groups,
  } = pluginConfig;
  const { args, command } = pluginConfig.runner;

  const { duration, date } = await executeProcess({
    command,
    args,
    observer,
  });

  try {
    const processOutputPath = join(
      process.cwd(),
      pluginConfig.runner.outputFile,
    );

    // read process output from file system and parse it
    const auditOutputs = auditOutputsSchema.parse(
      JSON.parse((await readFile(processOutputPath)).toString()),
    );

    const audits = auditOutputs.map(auditOutput => {
      const auditMetadata = pluginConfig.audits.find(
        audit => audit.slug === auditOutput.slug,
      );
      if (!auditMetadata) {
        throw new PluginOutputError(
          slug,
          new Error(
            `Audit metadata not found for slug ${auditOutput.slug} from runner output`,
          ),
        );
      }
      return {
        ...auditOutput,
        ...auditMetadata,
      };
    });

    // @TODO consider just resting/spreading the values
    return {
      version,
      packageName,
      slug,
      title,
      icon,
      date,
      duration,
      audits,
      ...(description && { description }),
      ...(docsUrl && { docsUrl }),
      ...(groups && { groups }),
    } satisfies PluginReport;
  } catch (error) {
    const e = error as Error;
    throw new PluginOutputError(slug, e);
  }
}

const NOOP_PROGRESS: ProgressBar = {
  incrementInSteps: () => { /* do nothing */ },
  updateTitle: () => { /* do nothing */ },
  endProgress:() => { /* do nothing */ },
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
  const progressBar = progress ? getProgressBar(progressName) : MOCK_PROGRESS;

  const pluginsResult = await plugins.reduce(async (acc, pluginCfg) => {
    const outputs = await acc;

    progressBar.updateTitle(`Executing  ${chalk.bold(pluginCfg.title)}`);

    const pluginReport = await executePlugin(pluginCfg);
    progressBar.incrementInSteps(plugins.length);

    return outputs.concat(pluginReport);
  }, Promise.resolve([] as PluginReport[]));

  progressBar.endProgress('Done running plugins');

  return pluginsResult;
}
