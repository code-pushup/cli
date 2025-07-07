import type { Audit } from '@code-pushup/models';
import type { BundleStatsOptions } from '../types';
import type { BundleStatsRunnerOptions } from './bundle-stats-runner';

export type SupportedBundlers = 'esbuild' | 'webpack' | 'vite' | 'rsbuild';

export type MinMax = [number, number];

export type PatternList = readonly string[];

export type ArtefactGroupingOptions = {
  include?: string[];
  exclude?: string[];
  includeInputs?: string[];
  excludeInputs?: string[];
};

export type BundleStatsConfig = Pick<Audit, 'title' | 'slug' | 'description'> &
  ArtefactGroupingOptions & {
    thresholds: {
      totalSize: MinMax;
      artefactSize?: MinMax;
    };
  };

export interface GroupingOptions {
  name: string;
  patterns: PatternList;
  icon?: string;
  depth?: number;
}

export interface PruningOptions {
  maxChildren?: number;
  startDepth?: number;
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

export interface GroupingRule {
  name: string;
  patterns: PatternList;
  icon?: string;
  depth?: number;
}
