import { Report } from '@code-pushup/models';
import { executePlugins } from '../implementation/execute-plugin';
import { calcDuration } from '@code-pushup/utils';
import { CommandBaseOptions } from '../implementation/model';

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

export type CollectOptions = CommandBaseOptions;

/**
 * Run audits, collect plugin output and aggregate it into a JSON object
 * @param options
 */
export async function collect(
  options: CollectOptions,
): Promise<Omit<Report, 'packageName' | 'version'>> {
  const { plugins, categories } = options;

  if (!plugins?.length) {
    throw new Error('No plugins registered');
  }

  const date = new Date().toISOString();
  const start = performance.now();
  const pluginOutputs = await executePlugins(plugins);

  return {
    date,
    duration: calcDuration(start),
    categories,
    plugins: pluginOutputs,
  };
}
