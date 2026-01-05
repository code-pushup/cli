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

  const date = new Date().toISOString();
  const start = performance.now();
  const packageJson = createRequire(import.meta.url)(
    '../../../package.json',
  ) as typeof import('../../../package.json');

  const commit = await profiler.measureAsync(
    'core:get-latest-commit',
    () => getLatestCommit(),
    {
      color: 'primary',
      success: (result: typeof commit) => ({
        properties: [
          ['Commit Found', result ? 'true' : 'false'],
          ...(result
            ? [
                ['Commit Hash', result.hash.substring(0, 8)],
                ['Author', result.author],
              ]
            : []),
        ],
        tooltipText: result
          ? `Found commit ${result.hash.substring(0, 8)} by ${result.author}`
          : 'No git commit found',
      }),
    },
  );
  logger.debug(
    commit
      ? `Found latest commit ${commit.hash} ("${commit.message}" by ${commit.author})`
      : 'Latest commit not found',
  );

  logger.info(
    `Collecting report from ${pluralizeToken('plugin', plugins.length)} ...`,
  );
  const pluginOutputs = await profiler.measureAsync(
    'core:execute-plugins',
    () => executePlugins({ plugins, persist, cache }),
    {
      color: 'primary',
      success: (pluginOutputs: Awaited<ReturnType<typeof executePlugins>>) => ({
        properties: [['Plugins Executed', String(pluginOutputs.length)]],
        tooltipText: `Executed ${pluginOutputs.length} plugin(s) successfully`,
      }),
    },
  );
  logger.info(ansis.green('Collected report ✓'));

  return profiler.measure(
    'core:create-report-object',
    () => ({
      commit,
      packageName: packageJson.name,
      version: packageJson.version,
      date,
      duration: calcDuration(start),
      categories,
      plugins: pluginOutputs,
    }),
    {
      color: 'primary',
      success: (report: ReturnType<typeof createReportObject>) => ({
        properties: [
          ['Package', report.packageName],
          ['Version', report.version],
          ['Categories', String(report.categories.length)],
          ['Plugins', String(report.plugins.length)],
        ],
        tooltipText: `Created report object for ${report.packageName} v${report.version}`,
      }),
    },
  );
}
