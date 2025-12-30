import ansis from 'ansis';
import { createRequire } from 'node:module';
import type {
  CacheConfigObject,
  CoreConfig,
  PersistConfig,
  Report,
} from '@code-pushup/models';
import {
  calcDuration,
  getLatestCommit,
  logger,
  pluralizeToken,
  profiler,
} from '@code-pushup/utils';
import { executePlugins } from './execute-plugin.js';

export type CollectOptions = Pick<CoreConfig, 'plugins' | 'categories'> & {
  persist?: PersistConfig;
  cache: CacheConfigObject;
};

/**
 * Run audits, collect plugin output and aggregate it into a JSON object
 * @param options
 */
export async function collect(options: CollectOptions): Promise<Report> {
  const { plugins, categories, persist = {}, cache } = options;

  return profiler.spanAsync(
    'collect',
    async () => {
      const date = new Date().toISOString();
      const start = performance.now();
      const packageJson = createRequire(import.meta.url)(
        '../../../package.json',
      ) as typeof import('../../../package.json');

      const commit = await getLatestCommit();
      logger.debug(
        commit
          ? `Found latest commit ${commit.hash} ("${commit.message}" by ${commit.author})`
          : 'Latest commit not found',
      );

      logger.info(
        `Collecting report from ${pluralizeToken('plugin', plugins.length)} ...`,
      );
      const pluginOutputs = await executePlugins({ plugins, persist, cache });
      logger.info(ansis.green('Collected report ✓'));

      return {
        commit,
        packageName: packageJson.name,
        version: packageJson.version,
        date,
        duration: calcDuration(start),
        categories,
        plugins: pluginOutputs,
      };
    },
    { detail: profiler.tracks.cli() },
  );
}
