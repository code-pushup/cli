import type { CategoryConfig, Group, PluginConfig } from '@code-pushup/models';
import { LIGHTHOUSE_GROUP_SLUGS, LIGHTHOUSE_PLUGIN_SLUG } from './constants.js';
import { orderSlug, shouldExpandForUrls } from './processing.js';
import { LIGHTHOUSE_GROUPS } from './runner/constants.js';
import type { LighthouseGroupSlugs } from './types.js';
import { isLighthouseGroupSlug } from './utils.js';

export function mergeLighthouseCategories(
  { groups }: Pick<PluginConfig, 'groups'>,
  categories?: CategoryConfig[],
): CategoryConfig[] {
  if (!groups) {
    return categories ?? [];
  }
  if (!categories) {
    return createCategories(groups);
  }
  return expandCategories(categories, groups);
}

function createCategories(groups: Group[]): CategoryConfig[] {
  const urlCount = countUrls(groups);
  if (!shouldExpandForUrls(urlCount)) {
    return [];
  }
  return extractGroupSlugs(groups)
    .filter(isLighthouseGroupSlug)
    .map(slug => createAggregatedCategory(slug, urlCount));
}

function expandCategories(
  categories: CategoryConfig[],
  groups: Group[],
): CategoryConfig[] {
  const urlCount = countUrls(groups);
  if (!shouldExpandForUrls(urlCount)) {
    return categories;
  }
  return categories.map(category =>
    expandAggregatedCategory(category, urlCount),
  );
}

export function createAggregatedCategory(
  groupSlug: LighthouseGroupSlugs,
  urlCount: number,
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
    refs: Array.from({ length: urlCount }, (_, i) => ({
      plugin: LIGHTHOUSE_PLUGIN_SLUG,
      slug: orderSlug(group.slug, i),
      type: 'group',
      weight: 1,
    })),
  };
}

export function expandAggregatedCategory(
  category: CategoryConfig,
  urlCount: number,
): CategoryConfig {
  return {
    ...category,
    refs: category.refs.flatMap(ref => {
      if (ref.plugin === LIGHTHOUSE_PLUGIN_SLUG) {
        return Array.from({ length: urlCount }, (_, i) => ({
          ...ref,
          slug: orderSlug(ref.slug, i),
        }));
      }
      return [ref];
    }),
  };
}

export function countUrls(groups: Group[]): number {
  const suffixes = groups
    .map(({ slug }) => slug.match(/-(\d+)$/)?.[1])
    .filter(Boolean)
    .map(Number)
    .filter(n => !Number.isNaN(n));
  return suffixes.length > 0 ? Math.max(...suffixes) : 1;
}

export function extractGroupSlugs(groups: Group[]): string[] {
  return [...new Set(groups.map(({ slug }) => slug.replace(/-\d+$/, '')))];
}
