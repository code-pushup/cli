import { createRequire } from 'node:module';
import type { Audit, PluginConfig } from '@code-pushup/models';
import { BUNDLE_STATS_PLUGIN_SLUG } from './constants.js';
import { normalizeBundleStatsOptions } from './normalize.js';
import {
  bundleStatsRunner,
  mergeAuditConfigs,
} from './runner/bundle-stats-runner.js';
import type { PluginOptions } from './types.js';

const PKG = createRequire(import.meta.url)('../../package.json');

export async function bundleStatsPlugin(
  options: PluginOptions,
): Promise<PluginConfig> {
  const {
    groups = [],
    bundler,
    artifactsPaths,
    generateArtifactsCommand,
    audits,
    ...pluginOptions
  } = options;

  const bundleStatsConfigs = mergeAuditConfigs(
    audits.map(normalizeBundleStatsOptions),
    pluginOptions,
  );

  const auditConfigs: Audit[] = bundleStatsConfigs.map(
    ({ slug, title, description, ..._ }) =>
      ({
        slug,
        title,
        description,
      }) satisfies Audit,
  );

  return {
    slug: BUNDLE_STATS_PLUGIN_SLUG,
    packageName: PKG.name,
    version: PKG.version,
    title: 'Bundle Stats',
    icon: 'folder-rules',
    description: 'Official Code PushUp Bundle Stats plugin.',
    docsUrl: 'https://npm.im/@code-pushup/bundle-stats-plugin',
    audits: auditConfigs,
    groups,
    runner: await bundleStatsRunner({
      bundler,
      artifactsPaths,
      generateArtifactsCommand,
      bundleStatsConfigs,
    }),
  };
}
