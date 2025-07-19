import type { Audit } from '@code-pushup/models';
import type { InsightsConfig } from './audits/details/table.js';
import type { ArtefactTreeOptions } from './audits/details/tree.js';
import type { PenaltyConfig } from './audits/issues.js';
import type { ScoringConfig } from './audits/scoring.js';
import type { SelectionOptions } from './audits/selection';

export type SupportedBundlers = 'esbuild' | 'webpack' | 'vite' | 'rsbuild';

export type MinMax = [number, number];

export type PatternList = readonly string[];

type AuditConfig = Pick<Audit, 'title' | 'slug'> &
  // @TODO this should be partial already
  Partial<Pick<Audit, 'description'>>;

export type BundleStatsConfig = AuditConfig & {
  selection: SelectionOptions;
  scoring: ScoringConfig;
  artefactTree?: ArtefactTreeOptions;
  insights?: InsightsConfig;
};

export interface GroupingRule {
  title?: string;
  patterns: PatternList;
  icon?: string;
  maxDepth?: number;
}

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

export interface BundleStatsAuditData {
  total: number;
  chunks: MinimalBundleStats[];
}

export interface Grouping {
  title: string;
  patterns: string[];
  icon?: string;
  maxDepth?: number;
}

export interface Insight {
  pattern: string | string[];
  label: string;
}
