import type { CategoryConfig, Group, PluginConfig } from '@code-pushup/models';
import {
  type PluginUrlContext,
  createCategoryRefs,
  expandCategoryRefs,
  removeIndex,
  shouldExpandForUrls,
  validateUrlContext,
} from '@code-pushup/utils';
import { LIGHTHOUSE_GROUP_SLUGS, LIGHTHOUSE_PLUGIN_SLUG } from './constants.js';
import { LIGHTHOUSE_GROUPS } from './runner/constants.js';
import type { LighthouseGroupSlug } from './types.js';
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
 *   categories: lighthouseCategories(lhPlugin),
 * };
 */
export function lighthouseCategories(
  plugin: Pick<PluginConfig, 'groups' | 'context'>,
  categories?: CategoryConfig[],
): CategoryConfig[] {
  if (!plugin.groups || plugin.groups.length === 0) {
    return categories ?? [];
  }
  validateUrlContext(plugin.context);
  if (!categories) {
    return createCategories(plugin.groups, plugin.context);
  }
  return expandCategories(categories, plugin.context);
}

/**
 * @deprecated
 * Helper is renamed, please use `lighthouseCategories` function instead.
 */
export const mergeLighthouseCategories = lighthouseCategories;

function createCategories(
  groups: Group[],
  context: PluginUrlContext,
): CategoryConfig[] {
  return extractGroupSlugs(groups).map(slug =>
    createAggregatedCategory(slug, context),
  );
}

function expandCategories(
  categories: CategoryConfig[],
  context: PluginUrlContext,
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
  context: PluginUrlContext,
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
    refs: createCategoryRefs(group.slug, LIGHTHOUSE_PLUGIN_SLUG, context),
  };
}

/**
 * Expands all refs (groups and audits) in a user-defined category for each URL.
 * Used when user categories are provided.
 */
export function expandAggregatedCategory(
  category: CategoryConfig,
  context: PluginUrlContext,
): CategoryConfig {
  return {
    ...category,
    refs: category.refs.flatMap(ref =>
      ref.plugin === LIGHTHOUSE_PLUGIN_SLUG
        ? expandCategoryRefs(ref, context)
        : [ref],
    ),
  };
}

/**
 * Extracts unique, unsuffixed group slugs from a list of groups.
 * Useful for deduplicating and normalizing group slugs when generating categories.
 */
export function extractGroupSlugs(groups: Group[]): LighthouseGroupSlug[] {
  const slugs = groups.map(({ slug }) => removeIndex(slug));
  return [...new Set(slugs)].filter(isLighthouseGroupSlug);
}
