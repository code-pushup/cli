import { CoreConfig, GlobalOptions, Report } from '@code-pushup/models';
import { calcDuration } from '@code-pushup/utils';
import { name, version } from '../../../package.json';
import { executePlugins } from './execute-plugin';

export type CollectOptions = Pick<GlobalOptions, 'verbose' | 'progress'> &
  Pick<CoreConfig, 'plugins' | 'categories' | 'upload'>;

/**
 * Run audits, collect plugin output and aggregate it into a JSON object
 * @param options
 */
export async function collect(options: CollectOptions): Promise<Report> {
  const { plugins, categories } = options;
  console.log('plugins', plugins.length);
  if (!plugins?.length) {
    // @TODO wove this validation into the model
    throw new Error('No plugins registered');
  }
  const date = new Date().toISOString();
  const start = performance.now();
  const pluginOutputs = await executePlugins(plugins, options);

  return {
    packageName: name,
    version,
    date,
    duration: calcDuration(start),
    categories,
    plugins: pluginOutputs,
  };
}
