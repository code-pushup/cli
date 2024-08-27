import type { CoreConfig, Report } from '@code-pushup/models';
import { calcDuration, getLatestCommit } from '@code-pushup/utils';
import { name, version } from '../../../package.json';
import type { GlobalOptions } from '../types';
import { executePlugins } from './execute-plugin';

export type CollectOptions = Required<
  Pick<CoreConfig, 'plugins' | 'categories'>
> &
  Partial<GlobalOptions>;

/**
 * Run audits, collect plugin output and aggregate it into a JSON object
 * @param options
 */
export async function collect(options: CollectOptions): Promise<Report> {
  const { plugins, categories } = options;
  const date = new Date().toISOString();
  const start = performance.now();
  const commit = await getLatestCommit();
  const pluginOutputs = await executePlugins(plugins, options);
  return {
    commit,
    packageName: name,
    version,
    date,
    duration: calcDuration(start),
    categories,
    plugins: pluginOutputs,
  };
}
