import type { Audit } from '@code-pushup/models';
import type { InsightsConfig } from './audits/details/table.js';
import type { ArtefactTreeOptions } from './audits/details/tree.js';
import type { ScoringConfig } from './audits/scoring.js';
import type { SelectionConfig } from './audits/selection.js';

export type SupportedBundlers = 'esbuild' | 'webpack' | 'vite' | 'rsbuild';

export type MinMax = [number, number];

export type PatternList = readonly string[];

/**
 * List of blacklist entries for penalty configuration
 */
export type BlacklistPatternList = readonly BlacklistEntry[];

/**
 * Blacklist entry that can be either a simple pattern string or an object with pattern and optional hint.
 */
export type BlacklistEntry =
  | string
  | {
      pattern: string;
      hint?: string;
    };

type AuditConfig = Pick<Audit, 'title' | 'slug'> &
  // @TODO this should be partial already
  Partial<Pick<Audit, 'description'>>;

export type BundleStatsConfig = AuditConfig & {
  selection: SelectionConfig;
  scoring: ScoringConfig;
  artefactTree?: ArtefactTreeOptions | false;
  insights?: InsightsConfig | false;
};

export type GroupingRule = {
  title?: string;
  patterns: string | PatternList;
  icon?: string;
  numSegments?: number;
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

export interface BundleStatsAuditData {
  total: number;
  chunks: MinimalBundleStats[];
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
