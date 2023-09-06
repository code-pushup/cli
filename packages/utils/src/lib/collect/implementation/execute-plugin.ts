import {PluginConfigSchema, runnerOutputSchema, RunnerOutputSchema} from '@quality-metrics/models';
import {join} from 'path';
import {executeProcess, ProcessConfig} from './execute-process';
import {readFileSync} from 'fs';

/**
 * Error thrown when plugin output is invalid.
 * @public
 * @param message - error message
 */
export class PluginOutputError extends Error {
  //@TODO add trace of zod parsing error
  constructor(pluginSlug: string, error?: Error) {
    super(`Plugin output of plugin with slug ${pluginSlug} is invalid. \n Zod Error: ${error?.message}`);
    if(error) {
      this.name = error.name;
      this.stack = error.stack;
    }
  }
}

/**
 * Execute a plugin.
 * @public
 * @param cfg - {@link ProcessConfig} object with runner and meta
 * @param observer - process {@link ProcessObserver}
 * @returns {Promise<RunnerOutputSchema>} - runner output
 * @throws {PluginOutputError} - if plugin output is invalid
 *
 * @param cfg
 * @param observer
 *
 * @example
 * // plugin execution
 * const cfg = pluginConfigSchema.parse({...});
 *  const output = await executeProcess(cfg);
 *  console.log(output.stdout); // hello world
 *  console.log(output.stderr); // ''
 *  console.log(output.code); // 0
 *
 *  @example
 *  // error handling
 *  try {
 *  await executeProcess(cfg);
 *  } catch (e) {
 *  console.log(e.message); // Plugin output is invalid
 *  }
 */
export function executePlugin(
  cfg: PluginConfigSchema,
  observer?: ProcessConfig['observer']
): Promise<RunnerOutputSchema> {
  const command = cfg.runner.command.toString() || '';
  const args = cfg.runner.args || [];
  const processOutputPath = join(process.cwd(), cfg.runner.outputPath);

  return (
    executeProcess({
      command,
      args,
      observer,
    })
      // read process output from file system and parse it
      .then(() => {
        const outContent = readFileSync(processOutputPath).toString();
        try {
          return runnerOutputSchema.parse(JSON.parse(outContent));
        } catch (e) {
          throw new PluginOutputError(cfg.meta.slug, e);
        }
      })
  );
}


/**
 * Execute multiple plugins and aggregates their output.
 * @public
 * @param plugins - array of {@link PluginConfigSchema} objects
 * @returns {Promise<RunnerOutputSchema>} - runner output
 *
 * @example
 * // plugin execution
 * const cfg = pluginConfigSchema.parse({...});
 * const output = await executeProcess(cfg);
 * console.log(output.stdout); // hello world
 * console.log(output.stderr); // ''
 * console.log(output.code); // 0
 *
 * @example
 * // error handling
 * try {
 * await executeProcess(cfg);
 * } catch (e) {
 * console.log(e.message); // Plugin output is invalid
 * }
 *
 */
export async function executePlugins(
  plugins: PluginConfigSchema[],
): Promise<RunnerOutputSchema> {
  return await plugins.reduce(
    async (acc, pluginCfg) => {
      const outputs = await acc;
      const runnerOutput = await executePlugin(pluginCfg);
      outputs.audits.concat(runnerOutput.audits);
      return outputs;
    },
    Promise.resolve({audits: []} as RunnerOutputSchema),
  );
}
