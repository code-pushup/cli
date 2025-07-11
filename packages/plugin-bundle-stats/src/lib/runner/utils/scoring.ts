import type { Issue } from '@code-pushup/models';
import type { BundleStatsConfig, PenaltyOptions } from '../types.js';

/**
 * Calculates the bundle score based on total size, threshold, and diagnostic issues
 *
 * @param total - Total bundle size in bytes (S)
 * @param config - Bundle configuration containing thresholds
 * @param issues - Array of diagnostic issues with severity levels
 * @param penaltyOptions - Penalty configuration with weights
 * @returns Final blended score as a ratio (0-1) where 1 is perfect, lower values indicate regressions
 */
export function calculateScore(
  total: number,
  config: BundleStatsConfig,
  issues: Issue[] = [],
  penaltyOptions: PenaltyOptions = {},
): number {
  const threshold = config.thresholds.totalSize;
  let maxThreshold: number;

  if (Array.isArray(threshold)) {
    maxThreshold = threshold[1]; // Use max value from [min, max] tuple
  } else {
    maxThreshold = threshold;
  }

  // Size score calculation: 1.0 if within threshold, decreasing as size increases
  let sizeScore: number;
  if (total <= maxThreshold) {
    sizeScore = 1.0;
  } else {
    // Calculate how much over the threshold we are
    const excess = total - maxThreshold;
    const excessRatio = excess / maxThreshold;

    // Score decreases linearly, but doesn't go below 0
    sizeScore = Math.max(0, 1 - excessRatio);
  }

  // Get penalty weights with defaults
  const errorWeight = penaltyOptions.errorWeight ?? 1; // we = 1 (default)
  const warningWeight = penaltyOptions.warningWeight ?? 0.5; // ww = 0.5 (default)
  const blacklistWeight = penaltyOptions.blacklistWeight ?? warningWeight; // Default to warning weight

  // Count different issue types by severity
  const errorCount = issues.filter(issue => issue.severity === 'error').length;
  const warningCount = issues.filter(
    issue => issue.severity === 'warning',
  ).length;

  // For blacklisted issues, we need to identify them from the warning issues
  // Since they come as warnings, we need to separate them from regular warnings
  const blacklistedCount = issues.filter(
    issue =>
      issue.severity === 'warning' &&
      (issue.message.includes('blacklist') ||
        issue.message.includes('forbidden') ||
        issue.message.includes('matches') ||
        issue.message.includes('pattern')),
  ).length;

  // Adjust warning count to exclude blacklisted issues
  const actualWarningCount = warningCount - blacklistedCount;

  // Issues penalty calculation: we × E + ww × W + wb × B
  const penalty =
    errorWeight * errorCount +
    warningWeight * actualWarningCount +
    blacklistWeight * blacklistedCount;

  // Final blended score: max(0, sizeScore - penalty/(we + ww + wb))
  const totalWeight = errorWeight + warningWeight + blacklistWeight;
  const normalizedPenalty = totalWeight > 0 ? penalty / totalWeight : 0;
  const finalScore = Math.max(0, sizeScore - normalizedPenalty);

  return finalScore;
}
