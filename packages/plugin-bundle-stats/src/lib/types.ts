import type { Group } from '@code-pushup/models';
import type { PenaltyConfig } from './runner/audits/details/issues.js';
import type { ScoringConfig } from './runner/audits/scoring.js';
import type { BundleStatsRunnerOptions } from './runner/bundle-stats-runner.js';
import type { BundleStatsConfig, MinMax } from './runner/types.js';

export type PenaltyOptions = Omit<PenaltyConfig, 'artefactSize'> & {
  artefactSize?: PenaltyConfig['artefactSize'] | number;
};

export type ScoringOptions = Omit<ScoringConfig, 'totalSize' | 'penalty'> & {
  totalSize: ScoringConfig['totalSize'] | number;
  penalty?: false | PenaltyOptions;
};

export type BundleStatsOptions = Omit<BundleStatsConfig, 'slug' | 'scoring'> & {
  slug?: string;
  scoring: ScoringOptions;
};

export type PluginOptions = Omit<
  BundleStatsRunnerOptions,
  'audits' | 'artefactsPath'
> & {
  audits: BundleStatsOptions[];
  groups?: Group[];
  artefactsPath: string;
};
