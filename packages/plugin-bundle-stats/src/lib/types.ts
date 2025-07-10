import type { BundleStatsRunnerOptions } from './runner/bundle-stats-runner.js';
import type { BundleStatsConfig, PenaltyOptions } from './runner/types.js';

export type BundleStatsOptions = Omit<
  BundleStatsConfig,
  'slug' | 'description'
> & {
  title: string;
  description?: string;
};

export type PluginOptions = Omit<
  BundleStatsRunnerOptions,
  'configs' | 'artefactsPath'
> & {
  configs: BundleStatsOptions[];
  artefactsPath: string;
};
