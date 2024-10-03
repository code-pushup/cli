import type { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { filterItemRefsBy } from '@code-pushup/utils';
import type { FilterOptions, Filterables } from './filter.model';
import {
  handleConflictingOptions,
  validateFilterOption,
  validateFinalState,
} from './validate-filter-options.utils';

export function filterMiddleware<T extends FilterOptions>(
  originalProcessArgs: T,
): T {
  const {
    plugins,
    categories = [],
    skipCategories = [],
    onlyCategories = [],
    skipPlugins = [],
    onlyPlugins = [],
    verbose = false,
  } = originalProcessArgs;

  if (
    skipCategories.length === 0 &&
    onlyCategories.length === 0 &&
    skipPlugins.length === 0 &&
    onlyPlugins.length === 0
  ) {
    return { ...originalProcessArgs, categories };
  }

  handleConflictingOptions('categories', onlyCategories, skipCategories);
  handleConflictingOptions('plugins', onlyPlugins, skipPlugins);

  const filteredCategories = applyCategoryFilters(
    { categories, plugins },
    skipCategories,
    onlyCategories,
    verbose,
  );
  const filteredPlugins = applyPluginFilters(
    { categories: filteredCategories, plugins },
    skipPlugins,
    onlyPlugins,
    verbose,
  );
  const finalCategories = filterItemRefsBy(filteredCategories, ref =>
    filteredPlugins.some(plugin => plugin.slug === ref.plugin),
  );

  validateFinalState(
    { categories: finalCategories, plugins: filteredPlugins },
    { categories, plugins },
  );

  return {
    ...originalProcessArgs,
    plugins: filteredPlugins,
    categories: finalCategories,
  };
}

function applyFilters<T>(
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

function applyCategoryFilters(
  { categories, plugins }: Filterables,
  skipCategories: string[],
  onlyCategories: string[],
  verbose: boolean,
): CategoryConfig[] {
  if (skipCategories.length === 0 && onlyCategories.length === 0) {
    return categories;
  }
  validateFilterOption(
    'skipCategories',
    { plugins, categories },
    { itemsToFilter: skipCategories, verbose },
  );
  validateFilterOption(
    'onlyCategories',
    { plugins, categories },
    { itemsToFilter: onlyCategories, verbose },
  );
  return applyFilters(categories, skipCategories, onlyCategories, 'slug');
}

function applyPluginFilters(
  { categories, plugins }: Filterables,
  skipPlugins: string[],
  onlyPlugins: string[],
  verbose: boolean,
): PluginConfig[] {
  const filteredPlugins = filterPluginsFromCategories({
    categories,
    plugins,
  });
  if (skipPlugins.length === 0 && onlyPlugins.length === 0) {
    return filteredPlugins;
  }
  validateFilterOption(
    'skipPlugins',
    { plugins: filteredPlugins, categories },
    { itemsToFilter: skipPlugins, verbose },
  );
  validateFilterOption(
    'onlyPlugins',
    { plugins: filteredPlugins, categories },
    { itemsToFilter: onlyPlugins, verbose },
  );
  return applyFilters(filteredPlugins, skipPlugins, onlyPlugins, 'slug');
}

function filterPluginsFromCategories({
  categories,
  plugins,
}: Filterables): PluginConfig[] {
  const validPluginSlugs = new Set(
    categories.flatMap(category => category.refs.map(ref => ref.plugin)),
  );
  return categories.length > 0
    ? plugins.filter(plugin => validPluginSlugs.has(plugin.slug))
    : plugins;
}
