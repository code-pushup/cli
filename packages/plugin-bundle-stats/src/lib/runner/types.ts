import type { Audit } from '@code-pushup/models';
import type { BundleStatsOptions } from '../types';
import type { BundleStatsRunnerOptions } from './bundle-stats-runner';

export type SupportedBundlers = 'esbuild' | 'webpack' | 'vite' | 'rsbuild';

export type MinMax = [number, number];

export type PatternList = readonly string[];

export type ArtefactSelectionOptions = {
  include?: string[];
  exclude?: string[];
  includeInputs?: string[];
  excludeInputs?: string[];
};

export type BundleStatsConfig = Pick<Audit, 'title' | 'slug' | 'description'> &
  ArtefactSelectionOptions & {
    penalty?: PenaltyOptions;
    grouping?: GroupingRule[];
    pruning?: Omit<PruningOptions, 'startDepth'>;
    thresholds: {
      totalSize: MinMax;
      artefactSize?: MinMax;
    };
  };

export interface GroupingRule {
  title: string;
  patterns: PatternList;
  icon?: string;
  maxDepth?: number;
}

export interface PruningOptions {
  maxChildren?: number;
  maxDepth?: number;
  startDepth?: number;
}

export interface PenaltyOptions {
  artefactSize?: MinMax;
  warningWeight?: number;
  errorWeight?: number;
  blacklist?: PatternList;
  blacklistWeight?: number;
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
