import { createRequire } from 'node:module';
import type { Audit, PluginConfig } from '@code-pushup/models';
import { BUNDLE_STATS_PLUGIN_SLUG } from './constants.js';
import { normalizeBundleStatsOptions } from './normalize.js';
import { bundleStatsRunner } from './runner/bundle-stats-runner.js';
import { type BundleStatsConfig } from './runner/types.js';
import type { PluginOptions } from './types.js';

const PKG = createRequire(import.meta.url)('../../package.json');

export async function bundleStatsPlugin(
  options: PluginOptions,
): Promise<PluginConfig> {
  const { groups = [], audits, ...restOptions } = options;

  const auditConfigs: BundleStatsConfig[] = audits.map(
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
    audits: auditConfigs.map(
      ({ slug, description, title, ..._ }) =>
        ({
          slug,
          title,
          description,
        }) satisfies Audit,
    ),
    groups: groups ?? [],
    runner: await bundleStatsRunner({
      ...restOptions,
      audits: auditConfigs,
    }),
  };
}
