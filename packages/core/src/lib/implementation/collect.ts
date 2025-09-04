import { createRequire } from 'node:module';
import type {
  CacheConfigObject,
  CoreConfig,
  PersistConfig,
  Report,
} from '@code-pushup/models';
import { calcDuration, getLatestCommit } from '@code-pushup/utils';
import type { GlobalOptions } from '../types.js';
import { executePlugins } from './execute-plugin.js';

export type CollectOptions = Pick<CoreConfig, 'plugins' | 'categories'> & {
  persist?: PersistConfig;
  cache: CacheConfigObject;
} & Partial<GlobalOptions>;

/**
 * Run audits, collect plugin output and aggregate it into a JSON object
 * @param options
 */
export async function collect(options: CollectOptions): Promise<Report> {
  const { plugins, categories, persist = {}, cache, ...otherOptions } = options;
  const date = new Date().toISOString();
  const start = performance.now();
  const commit = await getLatestCommit();
  const pluginOutputs = await executePlugins(
    { plugins, persist, cache },
    otherOptions,
  );
  const packageJson = createRequire(import.meta.url)(
    '../../../package.json',
  ) as typeof import('../../../package.json');
  return {
    commit,
    packageName: packageJson.name,
    version: packageJson.version,
    date,
    duration: calcDuration(start),
    categories,
    plugins: pluginOutputs,
  };
}
