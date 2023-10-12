import {
  PluginConfig,
  PluginOutput,
  auditOutputsSchema,
} from '@code-pushup/models';
import { ProcessObserver, executeProcess } from '@code-pushup/utils';
import { readFile } from 'fs/promises';
import { join } from 'path';

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
): Promise<PluginOutput> {
  const { slug, title, icon, description, docsUrl, version, packageName } =
    pluginConfig;
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
    const audits = auditOutputsSchema.parse(
      JSON.parse((await readFile(processOutputPath)).toString()),
    );

    return {
      version,
      packageName,
      slug,
      title,
      icon,
      description,
      docsUrl,
      date,
      duration,
      audits,
    };
  } catch (error) {
    const e = error as Error;
    throw new PluginOutputError(slug, e);
  }
}

/**
 * Execute multiple plugins and aggregates their output.
 * @public
 * @param plugins - array of {@link PluginConfig} objects
 * @returns {Promise<AuditOutput[]>} - runner output
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
): Promise<PluginOutput[]> {
  return await plugins.reduce(async (acc, pluginCfg) => {
    const outputs = await acc;
    const pluginOutput = await executePlugin(pluginCfg);
    return outputs.concat(pluginOutput);
  }, Promise.resolve([] as PluginOutput[]));
}
