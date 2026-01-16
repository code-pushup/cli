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
import { AXE_PLUGIN_SLUG } from './constants.js';
import { axeGroupRefs } from './utils.js';

/**
 * @deprecated Use `axeGroupRefs` to build categories manually instead.
 *
 * @example
 * // Instead of:
 * const categories = axeCategories(axePlugin);
 *
 * // Use:
 * const categories = [
 *   {
 *     slug: 'a11y',
 *     title: 'Accessibility',
 *     refs: axeGroupRefs(axePlugin),
 *   },
 * ];
 */
export function axeCategories(
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

function createCategories(
  plugin: Pick<PluginConfig, 'groups' | 'context'>,
): CategoryConfig[] {
  return [
    {
      slug: 'axe-a11y',
      title: 'Axe Accessibility',
      refs: axeGroupRefs(plugin),
    },
  ];
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
