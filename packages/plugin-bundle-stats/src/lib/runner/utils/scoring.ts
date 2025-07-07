import type { BundleStatsConfig } from '../types.js';

/**
 * Calculates the bundle score based on total size and threshold
 *
 * @param total - Total bundle size in bytes
 * @param config - Bundle configuration containing thresholds
 * @returns Score as a ratio (0-1) of actual size to threshold, capped at 1
 */
export function calculateScore(
  total: number,
  config: BundleStatsConfig,
): number {
  const threshold = config.thresholds.totalSize;
  let maxThreshold: number;

  if (Array.isArray(threshold)) {
    maxThreshold = threshold[1]; // Use max value from [min, max] tuple
  } else {
    maxThreshold = threshold;
  }

  // Score calculation: 1.0 if within threshold, decreasing as size increases
  if (total <= maxThreshold) {
    return 1.0;
  }

  // Calculate how much over the threshold we are
  const excess = total - maxThreshold;
  const excessRatio = excess / maxThreshold;

  // Score decreases linearly, but doesn't go below 0
  return Math.max(0, 1 - excessRatio);
}
