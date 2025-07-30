import type { Audit } from '@code-pushup/models';
import type {
  PluginDependencyTreeOptions,
  PluginScoringOptions,
  PluginSelectionOptions,
} from '../types.js';
import type { InsightsTableConfig } from './audits/details/table.js';
import type { DependencyTreeConfig } from './audits/details/tree.js';
import type { ScoringConfig } from './audits/scoring.js';
import type { SelectionConfig } from './audits/selection.js';

export type SupportedBundlers = 'webpack' | 'vite' | 'esbuild' | 'rsbuild';

export type MinMax = [number, number];

export type PatternList = readonly string[];

export type AuditOptions = Required<Pick<Audit, 'slug' | 'title'>> &
  Partial<Pick<Audit, 'description'>>;

export type BundleStatsConfig = AuditOptions & {
  selection: SelectionConfig;
  scoring: ScoringConfig;
  dependencyTree?: DependencyTreeConfig;
  insightsTable?: InsightsTableConfig | false;
};

export interface PluginArtefactOptions {
  generateArtefacts?: {
    command: string;
    args: string[];
  };
  artefactsPath: string;
  bundler: SupportedBundlers;
}

export interface BundleStatsRunnerConfig extends PluginArtefactOptions {
  audits: BundleStatsConfig[];
  scoring?: PluginScoringOptions;
  dependencyTree?: PluginDependencyTreeOptions;
  insightsTable?: InsightsTableConfig;
  selection?: PluginSelectionOptions;
}

type OptionalGroupingRule = {
  title?: string;
  icon?: string;
  numSegments?: number;
};

export type GroupingRule = OptionalGroupingRule & {
  include: string | PatternList;
  exclude?: string | PatternList;
};

export type LogicalGroupingRule = Omit<GroupingRule, 'maxDepth'> & {
  maxDepth: 1;
};

export interface MinimalBundleStats {
  name: string;
  total: number;
  chunks: ChunkBundleStats[];
}

export interface ChunkBundleStats {
  name: string;
  size: number;
  modules: ModuleBundleStats[];
}

export interface ModuleBundleStats {
  name: string;
  size: number;
}

export interface Grouping {
  title: string;
  patterns: string | PatternList;
  icon?: string;
  maxDepth?: number;
}

export interface Insight {
  pattern: string | PatternList;
  label: string;
}
