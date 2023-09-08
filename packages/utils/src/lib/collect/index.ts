import {
  CoreConfig,
  GlobalCliArgs,
  reportSchema,
  Report,
} from '@quality-metrics/models';
import { executePlugins } from './implementation/execute-plugin';

/**
 * Error thrown when collect output is invalid.
 */
export class CollectOutputError extends Error {
  constructor(pluginSlug: string, error?: Error) {
    super(
      `Runner output from collect command is invalid. \n Zod Error: ${error?.message}`,
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
  const { plugins } = options;

  if (!plugins?.length) {
    throw new Error('No plugins registered');
  }

  const date = new Date().toISOString();
  performance.mark('startExecutePlugins');
  const runnerOutputs = await executePlugins(plugins);
  performance.mark('stopExecutePlugins');

  try {
    return reportSchema.parse({
      ...runnerOutputs,
      date,
      duration: performance.measure('startExecutePlugins', 'stopExecutePlugins')
        .duration,
    });
  } catch (error) {
    console.log('error: ', error);
    const e = error as Error;
    // throw new CollectOutputError(e.message);
  }
}
