import {
  type CategoryConfig,
  type PluginConfig,
  validate,
} from '@code-pushup/models';
import {
  type PluginUrlContext,
  expandCategoryRefs,
  pluginUrlContextSchema,
  shouldExpandForUrls,
} from '@code-pushup/utils';
import { LIGHTHOUSE_GROUP_SLUGS, LIGHTHOUSE_PLUGIN_SLUG } from './constants.js';
import { LIGHTHOUSE_GROUPS } from './runner/constants.js';
import type { LighthouseGroupSlug } from './types.js';
import { lighthouseGroupSlugs } from './utils.js';

/**
 * @deprecated Use `lighthouseGroupRefs` to build categories manually instead.
 *
 * @example
 * // Instead of:
 * const categories = lighthouseCategories(lhPlugin);
 *
 * // Use:
 * const categories = [
 *   {
 *     slug: 'performance',
 *     title: 'Performance',
 *     refs: lighthouseGroupRefs(lhPlugin, 'performance'),
 *   },
 * ];
 */
export function lighthouseCategories(
  plugin: Pick<PluginConfig, 'groups' | 'context'>,
  categories?: CategoryConfig[],
): CategoryConfig[] {
  if (!plugin.groups || plugin.groups.length === 0) {
    return categories ?? [];
  }
  if (!categories) {
    return createCategories(plugin);
  }
  return expandCategories(plugin, categories);
}

/**
 * @deprecated
 * Helper is renamed, please use `lighthouseCategories` function instead.
 */
export const mergeLighthouseCategories = lighthouseCategories;

function createCategories(
  plugin: Pick<PluginConfig, 'groups' | 'context'>,
): CategoryConfig[] {
  const context = validate(pluginUrlContextSchema, plugin.context);
  return lighthouseGroupSlugs(plugin).map(slug =>
    createAggregatedCategory(slug, context),
  );
}

function expandCategories(
  plugin: Pick<PluginConfig, 'context'>,
  categories: CategoryConfig[],
): CategoryConfig[] {
  const context = validate(pluginUrlContextSchema, plugin.context);
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
    refs: expandCategoryRefs(
      { plugin: LIGHTHOUSE_PLUGIN_SLUG, slug: group.slug, type: 'group' },
      context,
    ),
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
