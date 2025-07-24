import type { Group, PluginArtifactOptions } from '@code-pushup/models';
import type { InsightsTableConfig } from './runner/audits/details/table.js';
import type { DependencyTreeConfig } from './runner/audits/details/tree.js';
import type { PenaltyConfig } from './runner/audits/scoring.js';
import type { ScoringConfig } from './runner/audits/scoring.js';
import type { SelectionConfig } from './runner/audits/selection.js';
import type { SupportedBundlers } from './runner/types.js';

export type SelectionGeneralConfig = {
  include?: string[];
  exclude?: string[];
};

export type PluginDependencyTreeOptions = Omit<
  Partial<DependencyTreeConfig>,
  'enabled'
>;

export type DependencyTreeOptions = DependencyTreeConfig;

export type SelectionOptions = SelectionGeneralConfig & SelectionConfig;

export type PluginSelectionOptions = Omit<
  SelectionOptions,
  | 'include'
  | 'includeOutputs'
  | 'includeInputs'
  | 'includeImports'
  | 'includeEntryPoints'
>;

export type PenaltyOptions = Omit<PenaltyConfig, 'artefactSize'> & {
  artefactSize?: PenaltyConfig['artefactSize'] | number;
};

export type ScoringOptions = {
  totalSize: ScoringConfig['totalSize'] & number;
  penalty?: PenaltyOptions;
};

export type PluginPenaltyOptions = Omit<PenaltyOptions, 'totalSize'>;

export type PluginScoringOptions = {
  penalty?: PluginPenaltyOptions;
};

export type InsightsTableOptions = InsightsTableConfig;
export type PluginInsightsTableOptions = InsightsTableConfig;

export type BundleStatsAuditOptions = {
  slug?: string;
  title: string;
  description?: string;
  selection?: SelectionOptions;
  scoring?: ScoringOptions;
  dependencyTree?: DependencyTreeOptions;
  insightsTable?: InsightsTableOptions | false;
};

export type PluginBundleStatsAuditOptions = {
  selection?: PluginSelectionOptions;
  scoring?: PluginScoringOptions;
  dependencyTree?: PluginDependencyTreeOptions;
  insightsTable?: PluginInsightsTableOptions;
};

export type PluginOptions = {
  groups?: Group[];
  bundler: SupportedBundlers;
  audits: BundleStatsAuditOptions[];
} & PluginBundleStatsAuditOptions &
  PluginArtifactOptions;
