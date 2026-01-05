import type { CategoryConfig, Group, PluginConfig } from '@code-pushup/models';
import {
  type PluginUrlContext,
  createCategoryRefs,
  expandCategoryRefs,
  removeIndex,
  shouldExpandForUrls,
  validateUrlContext,
} from '@code-pushup/utils';
import { AXE_PLUGIN_SLUG } from './constants.js';
import { type AxeCategoryGroupSlug, isAxeGroupSlug } from './groups.js';

/**
 * Creates categories for the Axe plugin.
 *
 * @public
 * @param plugin - {@link PluginConfig} object with groups and context
 * @param categories - {@link CategoryConfig} optional user-defined categories
 * @returns {CategoryConfig[]} - expanded and aggregated categories
 *
 * @example
 * const axe = await axePlugin(urls);
 * const axeCoreConfig = {
 *   plugins: [axe],
 *   categories: axeCategories(axe),
 * };
 */
export function axeCategories(
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

function createCategories(
  groups: Group[],
  context: PluginUrlContext,
): CategoryConfig[] {
  return [createAggregatedCategory(groups, context)];
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

export function createAggregatedCategory(
  groups: Group[],
  context: PluginUrlContext,
): CategoryConfig {
  const refs = extractGroupSlugs(groups).flatMap(slug =>
    createCategoryRefs(slug, AXE_PLUGIN_SLUG, context),
  );
  return {
    slug: 'axe-a11y',
    title: 'Axe Accessibility',
    refs,
  };
}

export function expandAggregatedCategory(
  category: CategoryConfig,
  context: PluginUrlContext,
): CategoryConfig {
  return {
    ...category,
    refs: category.refs.flatMap(ref =>
      ref.plugin === AXE_PLUGIN_SLUG ? expandCategoryRefs(ref, context) : [ref],
    ),
  };
}

export function extractGroupSlugs(groups: Group[]): AxeCategoryGroupSlug[] {
  const slugs = groups.map(({ slug }) => removeIndex(slug));
  return [...new Set(slugs)].filter(isAxeGroupSlug);
}
