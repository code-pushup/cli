import { minimatch } from 'minimatch';
import type { AuditOutput } from '@code-pushup/models';
import { formatBytes } from '@code-pushup/utils';
import type { BundleStatsConfig } from './types.js';
import type { UnifiedStats } from './unify/unified-stats.types.js';

export function filterUnifiedTreeByConfig(
  bundleStats: UnifiedStats,
  config: BundleStatsConfig[],
): UnifiedStats {
  return config.reduce((acc, config) => {
    const filteredStats = filterUnifiedTreeByConfigSingle(bundleStats, config);
    return { ...acc, ...filteredStats };
  }, {});
}

export function filterUnifiedTreeByConfigSingle(
  bundleStats: UnifiedStats,
  config: BundleStatsConfig,
): UnifiedStats | null {
  const { selection } = config;
  const includePatterns = selection.includeOutputs ?? [];
  const excludePatterns = selection.excludeOutputs ?? [];

  const filteredStats: UnifiedStats = {};

  for (const [path, stats] of Object.entries(bundleStats)) {
    const included =
      includePatterns.length === 0 ||
      includePatterns.some((pattern: string) => minimatch(path, pattern));
    const excluded = excludePatterns.some((pattern: string) =>
      minimatch(path, pattern),
    );

    if (included && !excluded) {
      filteredStats[path] = stats;
    }
  }

  return Object.keys(filteredStats).length > 0 ? filteredStats : null;
}

export function createDisplayValue(
  totalBytes: number,
  fileCount: number,
): string {
  const formattedBytes = formatBytes(totalBytes);
  const formattedFileCount = `${fileCount} file${fileCount === 1 ? '' : 's'}`;
  return `${formattedBytes} (${formattedFileCount})`;
}

export function createEmptyAudit(config: BundleStatsConfig): AuditOutput {
  return {
    slug: config.slug,
    score: 0,
    value: 0,
    displayValue: createDisplayValue(0, 0),
    details: {
      issues: [],
    },
  };
}
