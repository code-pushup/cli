import { CoreConfig, GlobalCliArgs, Report } from '@quality-metrics/models';
import { calcDuration } from '@quality-metrics/utils';
import { executePlugins } from './execute-plugin';

export type CollectOptions = GlobalCliArgs & CoreConfig;

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
