import { CoreConfig, GlobalCliArgs, Report } from '@quality-metrics/models';
import { executePlugins } from './implementation/execute-plugin';
import { readPackageJson } from './implementation/utils';

/**
 * Error thrown when collect output is invalid.
 */
export class CollectOutputError extends Error {
  constructor(pluginSlug: string, error?: Error) {
    super(
      `PluginOutput ${pluginSlug} from collect command is invalid. \n Zod Error: ${error?.message}`,
    );
    if (error) {
      this.name = error.name;
      this.stack = error.stack;
    }
  }
}

export type CollectOptions = GlobalCliArgs & CoreConfig;

/**
 * Run audits, collect plugin output and aggregate it into a JSON object
 * @param options
 */
export async function collect(options: CollectOptions): Promise<Report> {
  const { version, name } = await readPackageJson();
  const { plugins, categories } = options;

  if (!plugins?.length) {
    throw new Error('No plugins registered');
  }

  const date = new Date().toISOString();
  const start = Date.now();
  const pluginOutputs = await executePlugins(plugins);

  return {
    packageName: name,
    version,
    date,
    duration: Date.now() - start,
    categories,
    plugins: pluginOutputs,
  };
}
