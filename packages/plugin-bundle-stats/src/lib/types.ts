import type { Group } from '@code-pushup/models';
import type { PenaltyConfig } from './runner/audits/details/issues.js';
import type { InsightsConfig } from './runner/audits/details/table.js';
import type { AuditTreeOptions } from './runner/audits/details/tree.js';
import type { ScoringConfig } from './runner/audits/scoring.js';
import type { SelectionConfig } from './runner/audits/selection.js';
import type { BundleStatsRunnerOptions } from './runner/bundle-stats-runner.js';
import type { BundleStatsConfig, MinMax } from './runner/types.js';

export type PenaltyOptions = Omit<PenaltyConfig, 'artefactSize'> & {
  artefactSize?: PenaltyConfig['artefactSize'] | number;
};

export type ScoringOptions = {
  totalSize?: MinMax | number;
  penalty?: PenaltyOptions | false;
};

// Global selection options that don't allow includes (only excludes for safety)
export type GlobalSelectionOptions = {
  exclude?: string[];
  excludeOutputs?: string[];
  excludeInputs?: string[];
  excludeImports?: string[];
  excludeEntryPoints?: string[];
};

export type SelectionOptions = {
  include?: string[];
  includeOutputs?: string[];
  includeInputs?: string[];
  includeImports?: string[];
  includeEntryPoints?: string[];
} & GlobalSelectionOptions;

export interface BundleStatsOptions {
  slug?: string;
  title: string;
  description?: string;
  selection?: SelectionOptions;
  scoring?: ScoringOptions;
  dependencyTree?: AuditTreeOptions | false;
  insightsTable?: InsightsConfig | false;
}

export type PluginOptions = Omit<
  BundleStatsRunnerOptions,
  'audits' | 'artefactsPath'
> & {
  audits: BundleStatsOptions[];
  groups?: Group[];
  artefactsPath: string;
  selection: GlobalSelectionOptions;
};
