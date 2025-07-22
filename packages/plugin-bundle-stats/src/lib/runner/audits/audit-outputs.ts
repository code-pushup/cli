import type { AuditOutput } from '@code-pushup/models';
import type { BundleStatsConfig } from '../types.js';
import type { UnifiedStats } from '../unify/unified-stats.types.js';
import { createDisplayValue } from '../utils.js';
import { createEmptyAudit } from '../utils.js';
import { createAuditOutputDetails } from './details/audit-details.js';
import { getIssues } from './details/issues.js';
import { createBundleStatsScoring } from './utils/scoring.js';
import { selectBundles } from './utils/selection.js';

/**
 * Calculates total bytes from unified stats tree. Aggregates byte counts across all artefacts.
 */
export function calculateTotalBytes(statsSlice: UnifiedStats): number {
  return Object.values(statsSlice).reduce((acc, curr) => acc + curr.bytes, 0);
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

/**
 * Generates audit outputs from bundle stats tree and configurations
 */
export function generateAuditOutputs(
  bundleStatsTree: UnifiedStats,
  configs: BundleStatsConfig[],
): AuditOutput[] {
  return configs.map(config => {
    const filteredTree = selectBundles(bundleStatsTree, config.selection);

    if (!filteredTree || Object.keys(filteredTree).length === 0) {
      return createEmptyAudit(config);
    }

    return createAuditOutput(filteredTree, config);
  });
}
