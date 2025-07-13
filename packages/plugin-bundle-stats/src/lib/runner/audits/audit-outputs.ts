import type { AuditDetails, AuditOutput, Issue } from '@code-pushup/models';
import type { BundleStatsConfig } from '../types.js';
import type { UnifiedStats } from '../unify/unified-stats.types.js';
import { createDisplayValue } from '../utils.js';
import { createEmptyAudit } from '../utils.js';
import { getIssues } from './issues.js';
import { createBundleStatsScoring } from './scoring.js';
import { selectArtefacts } from './selection.js';
import { createInsightsTable } from './table.js';
import { DEFAULT_PRUNING, createTree } from './tree.js';

/**
 * Calculates total bytes from unified stats tree. Aggregates byte counts across all artefacts.
 */
export function calculateTotalBytes(filteredTree: UnifiedStats): number {
  return Object.values(filteredTree).reduce((acc, curr) => acc + curr.bytes, 0);
}

/**
 * Creates audit output from processed tree data and configuration. Combines size scoring with penalty calculations from actual issues.
 */
export function createAuditOutput(
  statsSlice: UnifiedStats,
  config: BundleStatsConfig,
): AuditOutput {
  const trees = Object.values(statsSlice);
  const totalBytes = calculateTotalBytes(statsSlice);
  const issues = getIssues(statsSlice, config);

  const calculateScore = createBundleStatsScoring({
    totalSize: config.scoring.totalSize,
    penalty: config.scoring.penalty,
  });

  return {
    slug: config.slug,
    score: calculateScore(totalBytes, issues),
    value: totalBytes,
    displayValue: createDisplayValue(totalBytes, trees.length),
    details: createAuditOutputDetails(issues, statsSlice, config),
  };
}

export function createAuditOutputDetails(
  issues: Issue[],
  statsSlice: UnifiedStats,
  config: BundleStatsConfig,
): AuditDetails {
  const details: AuditDetails = {
    issues,
  };

  if (config.insights && config.insights.length > 0) {
    details.table = createInsightsTable(statsSlice, config.insights);
  }

  if (config.artefactTree) {
    details.trees = [
      createTree(statsSlice, {
        title: config.slug,
        pruning: {
          ...DEFAULT_PRUNING,
          ...config.artefactTree.pruning,
        },
        groups: config.artefactTree.groups ?? [],
      }),
    ];
  }

  return details;
}

/**
 * Generates audit outputs from bundle stats tree and configurations
 */
export function generateAuditOutputs(
  bundleStatsTree: UnifiedStats,
  configs: BundleStatsConfig[],
): AuditOutput[] {
  return configs.map(config => {
    const filteredTree = selectArtefacts(bundleStatsTree, config.selection);

    if (!filteredTree || Object.keys(filteredTree).length === 0) {
      return createEmptyAudit(config);
    }

    return createAuditOutput(filteredTree, config);
  });
}
