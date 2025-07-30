import type { AuditDetails, Issue } from '@code-pushup/models';
import type { BundleStatsConfig } from '../../types.js';
import type { UnifiedStats } from '../../unify/unified-stats.types.js';
import { createInsightsTable } from './table.js';
import { createTree } from './tree.js';

/**
 * Creates audit details containing issues, insights table, and artifact tree based on configuration.
 * Assembles comprehensive output details for bundle analysis reporting.
 */
export function createAuditOutputDetails(
  issues: Issue[],
  statsSlice: UnifiedStats,
  config: BundleStatsConfig,
): AuditDetails {
  const details: AuditDetails = {
    issues,
  };

  if (
    config.insightsTable &&
    config.insightsTable.groups &&
    config.insightsTable.groups.length > 0
  ) {
    console.time('📊 CREATE_INSIGHTS_TABLE');
    details.table = createInsightsTable(statsSlice, config.insightsTable);
    console.timeEnd('📊 CREATE_INSIGHTS_TABLE');
  }

  // Check if dependency tree is enabled (default: enabled if config exists)
  const isTreeEnabled =
    config.dependencyTree &&
    typeof config.dependencyTree === 'object' &&
    (!('enabled' in config.dependencyTree) ||
      config.dependencyTree.enabled !== false);

  if (isTreeEnabled && typeof config.dependencyTree === 'object') {
    console.time('🌳 CREATE_TREE');
    details.trees = [
      createTree(statsSlice, {
        title: config.slug,
        mode: config.dependencyTree.mode ?? 'onlyMatching',
        pruning: config.dependencyTree.pruning ?? {},
        groups: config.dependencyTree.groups ?? [],
        selection: config.selection, // Pass selection config for onlyMatching filtering
      }),
    ];
    console.timeEnd('🌳 CREATE_TREE');
  }

  return details;
}
