import type { CategoryRef, CoreConfig } from '@code-pushup/models';
import type { Filterables } from './filter.model';

export function applyFilters<T>(
  items: T[],
  skipItems: string[],
  onlyItems: string[],
  key: keyof T,
): T[] {
  return items.filter(item => {
    const itemKey = item[key] as unknown as string;
    return (
      !skipItems.includes(itemKey) &&
      (onlyItems.length === 0 || onlyItems.includes(itemKey))
    );
  });
}

export function extractSkippedItems<T extends { slug: string }>(
  originalItems: T[] | undefined,
  filteredItems: T[] | undefined,
): string[] {
  if (!originalItems || !filteredItems) {
    return [];
  }
  const filteredSlugs = new Set(filteredItems.map(({ slug }) => slug));
  return originalItems
    .filter(({ slug }) => !filteredSlugs.has(slug))
    .map(({ slug }) => slug);
}

export function filterSkippedItems<T extends { isSkipped?: boolean }>(
  items: T[] | undefined,
): Omit<T, 'isSkipped'>[] {
  return (items ?? [])
    .filter(({ isSkipped }) => isSkipped !== true)
    .map(({ isSkipped, ...props }) => props);
}

export function isValidCategoryRef(
  ref: CategoryRef,
  plugins: Filterables['plugins'],
): boolean {
  const plugin = plugins.find(({ slug }) => slug === ref.plugin);
  if (!plugin) {
    return false;
  }
  switch (ref.type) {
    case 'audit':
      return plugin.audits.some(({ slug }) => slug === ref.slug);
    case 'group':
      return plugin.groups?.some(({ slug }) => slug === ref.slug) ?? false;
  }
}

export function filterPluginsFromCategories({
  categories,
  plugins,
}: Filterables): CoreConfig['plugins'] {
  if (!categories || categories.length === 0) {
    return plugins;
  }
  const validPluginSlugs = new Set(
    categories.flatMap(category => category.refs.map(ref => ref.plugin)),
  );
  return plugins.filter(plugin => validPluginSlugs.has(plugin.slug));
}
