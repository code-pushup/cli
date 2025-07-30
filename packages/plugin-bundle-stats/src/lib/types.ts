import type { Group, PluginArtifactOptions } from '@code-pushup/models';
import type {
  InsightsTableConfig,
  TablePruningConfig,
} from './runner/audits/details/table.js';
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

export type SelectionOptions = SelectionGeneralConfig & {
  mode?: 'bundle' | 'matchingOnly' | 'withStartupDeps' | 'withAllDeps';
  includeOutputs?: string[];
  excludeOutputs?: string[];
  includeInputs?: string[];
  excludeInputs?: string[];
  includeImports?: string[];
  excludeImports?: string[];
  includeEntryPoints?: string[];
  excludeEntryPoints?: string[];
};

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
  enabled?: boolean;
  totalSize: ScoringConfig['totalSize'] | number;
  penalty?: PenaltyOptions;
};

export type PluginPenaltyOptions = Omit<PenaltyOptions, 'totalSize'>;

export type PluginScoringOptions = {
  penalty?: PluginPenaltyOptions;
};

export type InsightsTableOptions = InsightsTableConfig | false;
export type PluginInsightsTableOptions = InsightsTableConfig | false;

export type BundleStatsAuditOptions = {
  slug?: string;
  title: string;
  description?: string;
  selection?: SelectionOptions;
  scoring?: ScoringOptions;
  dependencyTree?: DependencyTreeOptions;
  insightsTable?: InsightsTableOptions;
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
