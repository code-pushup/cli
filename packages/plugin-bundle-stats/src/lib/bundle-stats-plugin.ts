import { createRequire } from 'node:module';
import type { PluginConfig } from '@code-pushup/models';
import {
  BUNDLE_STATS_PLUGIN_SLUG,
  DEFAULT_GROUPING,
  DEFAULT_PENALTY,
  DEFAULT_PRUNING,
} from './constants.js';
import { normalizeBundleStatsOptions } from './normalize.js';
import { bundleStatsRunner } from './runner/bundle-stats-runner.js';
import { type BundleStatsConfig } from './runner/types.js';
import type { PluginOptions } from './types.js';

const PKG = createRequire(import.meta.url)('../../package.json');

export async function bundleStatsPlugin(
  opts: PluginOptions,
): Promise<PluginConfig> {
  const {
    configs,
    grouping = DEFAULT_GROUPING,
    pruning = DEFAULT_PRUNING,
    penalty = DEFAULT_PENALTY,
    ...restOptions
  } = opts;

  const runnerConfigs: BundleStatsConfig[] = configs.map(
    normalizeBundleStatsOptions,
  );

  return {
    slug: BUNDLE_STATS_PLUGIN_SLUG,
    packageName: PKG.name,
    version: PKG.version,
    title: 'Bundle Stats',
    icon: 'folder-rules',
    description: 'Official Code PushUp Bundle Stats plugin.',
    docsUrl: 'https://npm.im/@code-pushup/bundle-stats-plugin',
    audits: runnerConfigs,
    runner: await bundleStatsRunner({
      ...restOptions,
      configs: runnerConfigs,
      grouping,
      pruning,
      penalty,
    }),
  };
}
