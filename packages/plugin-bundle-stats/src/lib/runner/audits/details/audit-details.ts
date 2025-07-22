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

  if (config.insights && config.insights.length > 0) {
    console.time('📊 CREATE_INSIGHTS_TABLE');
    details.table = createInsightsTable(statsSlice, config.insights);
    console.timeEnd('📊 CREATE_INSIGHTS_TABLE');
  }

  if (config.artefactTree) {
    console.time('🌳 CREATE_TREE');
    details.trees = [
      createTree(statsSlice, {
        title: config.slug,
        pruning: config.artefactTree.pruning ?? {},
        groups: config.artefactTree.groups ?? [],
      }),
    ];
    console.timeEnd('🌳 CREATE_TREE');
  }

  return details;
}
