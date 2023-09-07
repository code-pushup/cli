import {
  PluginConfig,
  RunnerOutput,
  runnerOutputSchema,
} from '@quality-metrics/models';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { executeProcess, ProcessConfig } from './execute-process';

/**
 * Error thrown when plugin output is invalid.
 */
export class PluginOutputError extends Error {
  constructor(pluginSlug: string, error?: Error) {
    super(
      `Plugin output of plugin with slug ${pluginSlug} is invalid. \n Zod Error: ${error?.message}`,
    );
    if (error) {
      this.name = error.name;
      this.stack = error.stack;
    }
  }
}

export type PluginOutputSchema = RunnerOutput & {
  date: string;
  duration: number;
};

/**
 * Execute a plugin.
 *
 * @public
 * @param cfg - {@link ProcessConfig} object with runner and meta
 * @param observer - process {@link ProcessObserver}
 * @returns {Promise<RunnerOutput>} - runner output
 * @throws {PluginOutputError} - if plugin output is invalid
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
  cfg: PluginConfig,
  observer?: ProcessConfig['observer'],
): Promise<PluginOutputSchema> {
  const command = cfg.runner.command.toString() || '';
  const args = cfg.runner.args || [];
  const processOutputPath = join(process.cwd(), cfg.runner.outputPath);

  const processResult = await executeProcess({
    command,
    args,
    observer,
  });

  try {
    // read process output from file system and parse it
    const runnerOutput = runnerOutputSchema.parse(
      JSON.parse((await readFile(processOutputPath)).toString()),
    );

    return {
      date: processResult.date,
      duration: processResult.duration,
      ...runnerOutput,
    };
  } catch (e) {
    throw new PluginOutputError(cfg.meta.slug, e);
  }
}

/**
 * Execute multiple plugins and aggregates their output.
 * @public
 * @param plugins - array of {@link PluginConfig} objects
 * @returns {Promise<RunnerOutput>} - runner output
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
): Promise<PluginOutputSchema[]> {
  return await plugins.reduce(async (acc, pluginCfg) => {
    const outputs = await acc;
    const pluginOutput = await executePlugin(pluginCfg);
    return outputs.concat(pluginOutput);
  }, Promise.resolve([] as PluginOutputSchema[]));
}
