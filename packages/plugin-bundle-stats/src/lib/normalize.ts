import type { Audit } from '@code-pushup/models';
import { slugify } from '@code-pushup/utils';
import type { BundleStatsConfig } from './runner/types.js';
import type { BundleStatsOptions } from './types.js';

/**
 * Normalizes bundle stats options to the expected config format
 */
export function normalizeBundleStatsOptions(
  options: BundleStatsOptions,
): BundleStatsConfig {
  const {
    title,
    description,
    thresholds,
    include,
    exclude,
    includeInputs,
    excludeInputs,
  } = options;

  return {
    slug: slugify(title),
    title,
    ...(description ? { description } : {}),
    thresholds,
    include,
    exclude,
    includeInputs,
    excludeInputs,
  };
}

export function getAuditsFromConfigs(configs: BundleStatsConfig[]): Audit[] {
  return configs.map(({ slug, title, description }) => {
    return {
      slug,
      title,
      description,
    };
  });
}
