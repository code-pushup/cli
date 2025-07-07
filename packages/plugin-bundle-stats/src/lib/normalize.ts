import type { BundleStatsConfig } from './runner/types.js';
import type { BundleStatsOptions } from './types.js';

/**
 * Normalizes bundle stats options to the expected config format
 */
export function normalizeBundleStatsOptions(
  options: BundleStatsOptions,
): BundleStatsConfig {
  const {
    slug,
    title,
    description,
    thresholds,
    include,
    exclude,
    includeInputs,
    excludeInputs,
  } = options;

  return {
    slug,
    title: title || slug,
    description: description || `Bundle stats analysis for ${slug}`,
    thresholds,
    include,
    exclude,
    includeInputs,
    excludeInputs,
  };
}
