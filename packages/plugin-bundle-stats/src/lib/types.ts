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
 * Selection options for bundle filtering. Supports global patterns or specific pattern types.
 * Can use only global include/exclude patterns or combine them with specific pattern types.
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
    | { include: string[] } // Allow using only global include patterns
    | { exclude: string[] } // Allow using only global exclude patterns
  );

export type BundleStatsOptions = Omit<
  BundleStatsConfig,
  'slug' | 'scoring' | 'selection'
> & {
  slug?: string;
  scoring: ScoringOptions;
  selection: SelectionOptions;
};

export type PluginOptions = Omit<
  BundleStatsRunnerOptions,
  'audits' | 'artefactsPath'
> & {
  audits: BundleStatsOptions[];
  groups?: Group[];
  artefactsPath: string;
  selection: GlobalSelectionOptions;
};

export type GlobalSelectionOptions = Partial<
  Omit<
    SelectionConfig,
    'include' | 'includeInputs' | 'includeImports' | 'includeEntryPoints'
  >
>;
