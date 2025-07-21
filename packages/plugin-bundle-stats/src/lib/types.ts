import type { Group } from '@code-pushup/models';
import type { PenaltyConfig } from './runner/audits/details/issues.js';
import type { ScoringConfig } from './runner/audits/scoring.js';
import type { SelectionConfig } from './runner/audits/selection.js';
import type { BundleStatsRunnerOptions } from './runner/bundle-stats-runner.js';
import type { BundleStatsConfig, MinMax } from './runner/types.js';

export type PenaltyOptions = Omit<PenaltyConfig, 'artefactSize'> & {
  artefactSize?: PenaltyConfig['artefactSize'] | number;
};

export type ScoringOptions = Omit<ScoringConfig, 'totalSize' | 'penalty'> & {
  totalSize: ScoringConfig['totalSize'] | number;
  penalty?: false | PenaltyOptions;
};

/**
 * Selection options for bundle filtering. Extends SelectionConfig with global patterns and optional properties.
 * Requires at least one specific pattern type to be provided for filtering.
 */
export type SelectionOptions = Partial<SelectionConfig> & {
  /** Global patterns applied to all include pattern types */
  include?: string[];
  /** Global patterns applied to all exclude pattern types */
  exclude?: string[];
} & (
    | { includeOutputs: string[] }
    | { includeInputs: string[] }
    | { includeImports: string[] }
    | { includeEntryPoints: string[] }
  );

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
