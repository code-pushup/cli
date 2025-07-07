import type { BundleStatsRunnerOptions } from './runner/bundle-stats-runner.js';
import type { BundleStatsConfig } from './runner/types.js';

export type BundleStatsOptions = Omit<
  BundleStatsConfig,
  'title' | 'description'
> & {
  title?: string;
  description?: string;
};

export type PluginOptions = Omit<
  BundleStatsRunnerOptions,
  'configs' | 'artefactsPath'
> & {
  configs: BundleStatsOptions[];
  artefact: string;
};
