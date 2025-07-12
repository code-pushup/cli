import type { CategoryConfig, Group, PluginConfig } from '@code-pushup/models';
import { LIGHTHOUSE_GROUP_SLUGS, LIGHTHOUSE_PLUGIN_SLUG } from './constants.js';
import { orderSlug, shouldExpandForUrls } from './processing.js';
import { LIGHTHOUSE_GROUPS } from './runner/constants.js';
import type { LighthouseContext, LighthouseGroupSlug } from './types.js';
import { isLighthouseGroupSlug } from './utils.js';

/**
 * Expands and aggregates categories for multi-URL Lighthouse runs.
 *
 * - If user categories are provided, expands all refs (groups and audits) for each URL.
 * - If not, generates categories from plugin groups only.
 * - Assigns per-URL weights with correct precedence.
 *
 * @public
 * @param plugin - {@link PluginConfig} object with groups and context
 * @param categories - {@link CategoryConfig} optional user-defined categories
 * @returns {CategoryConfig[]} - expanded and agregated categories
 *
 * @example
 * const lhPlugin = await lighthousePlugin(urls);
 * const lhCoreConfig = {
 *   plugins: [lhPlugin],
 *   categories: mergeLighthouseCategories(lhPlugin),
 * };
 */
export function mergeLighthouseCategories(
  plugin: Pick<PluginConfig, 'groups' | 'context'>,
  categories?: CategoryConfig[],
): CategoryConfig[] {
  if (!plugin.groups || plugin.groups.length === 0) {
    return categories ?? [];
  }
  validateContext(plugin.context);
  if (!categories) {
    return createCategories(plugin.groups, plugin.context);
  }
  return expandCategories(categories, plugin.context);
}

function createCategories(
  groups: Group[],
  context: LighthouseContext,
): CategoryConfig[] {
  if (!shouldExpandForUrls(context.urlCount)) {
    return [];
  }
  return extractGroupSlugs(groups).map(slug =>
    createAggregatedCategory(slug, context),
  );
}

function expandCategories(
  categories: CategoryConfig[],
  context: LighthouseContext,
): CategoryConfig[] {
  if (!shouldExpandForUrls(context.urlCount)) {
    return categories;
  }
  return categories.map(category =>
    expandAggregatedCategory(category, context),
  );
}

/**
 * Creates a category config for a Lighthouse group, expanding it for each URL.
 * Only used when user categories are not provided.
 */
export function createAggregatedCategory(
  groupSlug: LighthouseGroupSlug,
  context: LighthouseContext,
): CategoryConfig {
  const group = LIGHTHOUSE_GROUPS.find(({ slug }) => slug === groupSlug);
  if (!group) {
    const availableSlugs = LIGHTHOUSE_GROUP_SLUGS.join(', ');
    throw new Error(
      `Invalid Lighthouse group slug: "${groupSlug}". Available groups: ${availableSlugs}`,
    );
  }
  return {
    slug: group.slug,
    title: group.title,
    ...(group.description && { description: group.description }),
    refs: Array.from({ length: context.urlCount }, (_, i) => ({
      plugin: LIGHTHOUSE_PLUGIN_SLUG,
      slug: shouldExpandForUrls(context.urlCount)
        ? orderSlug(group.slug, i)
        : group.slug,
      type: 'group',
      weight: resolveWeight(context.weights, i),
    })),
  };
}

/**
 * Expands all refs (groups and audits) in a user-defined category for each URL.
 * Used when user categories are provided.
 */
export function expandAggregatedCategory(
  category: CategoryConfig,
  context: LighthouseContext,
): CategoryConfig {
  return {
    ...category,
    refs: category.refs.flatMap(ref => {
      if (ref.plugin === LIGHTHOUSE_PLUGIN_SLUG) {
        return Array.from({ length: context.urlCount }, (_, i) => ({
          ...ref,
          slug: shouldExpandForUrls(context.urlCount)
            ? orderSlug(ref.slug, i)
            : ref.slug,
          weight: resolveWeight(context.weights, i, ref.weight),
        }));
      }
      return [ref];
    }),
  };
}

/**
 * Extracts unique, unsuffixed group slugs from a list of groups.
 * Useful for deduplicating and normalizing group slugs when generating categories.
 */
export function extractGroupSlugs(groups: Group[]): LighthouseGroupSlug[] {
  const slugs = groups.map(({ slug }) => slug.replace(/-\d+$/, ''));
  return [...new Set(slugs)].filter(isLighthouseGroupSlug);
}

export class ContextValidationError extends Error {
  constructor(message: string) {
    super(`Invalid Lighthouse context: ${message}`);
  }
}

export function validateContext(
  context: PluginConfig['context'],
): asserts context is LighthouseContext {
  if (!context || typeof context !== 'object') {
    throw new ContextValidationError('must be an object');
  }
  const { urlCount, weights } = context;
  if (typeof urlCount !== 'number' || urlCount < 0) {
    throw new ContextValidationError('urlCount must be a non-negative number');
  }
  if (!weights || typeof weights !== 'object') {
    throw new ContextValidationError('weights must be an object');
  }
  if (Object.keys(weights).length !== urlCount) {
    throw new ContextValidationError('weights count must match urlCount');
  }
}

function resolveWeight(
  weights: LighthouseContext['weights'],
  index: number,
  userDefinedWeight?: number,
): number {
  return weights[index + 1] ?? userDefinedWeight ?? 1;
}
