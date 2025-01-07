import type {
  CategoryConfig,
  CoreConfig,
  PluginConfig,
} from '@code-pushup/models';
import { filterItemRefsBy } from '@code-pushup/utils';
import type { FilterOptions, Filterables } from './filter.model.js';
import {
  handleConflictingOptions,
  isValidCategoryRef,
  validateFilterOption,
  validateFilteredCategories,
  validateFinalState,
} from './validate-filter-options.utils.js';

// eslint-disable-next-line max-lines-per-function
export function filterMiddleware<T extends FilterOptions>(
  originalProcessArgs: T,
): T {
  const {
    categories: rcCategories,
    plugins: rcPlugins,
    skipCategories = [],
    onlyCategories = [],
    skipPlugins = [],
    onlyPlugins = [],
    verbose = false,
  } = originalProcessArgs;

  const plugins = processPlugins(rcPlugins);
  const categories = filterSkippedCategories(rcCategories, plugins);

  if (rcCategories && categories) {
    validateFilteredCategories(rcCategories, categories, {
      onlyCategories,
      skipCategories,
      verbose,
    });
  }

  if (
    skipCategories.length === 0 &&
    onlyCategories.length === 0 &&
    skipPlugins.length === 0 &&
    onlyPlugins.length === 0
  ) {
    return {
      ...originalProcessArgs,
      ...(categories && { categories }),
      plugins,
    };
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
  const finalCategories = filteredCategories
    ? filterItemRefsBy(filteredCategories, ref =>
        filteredPlugins.some(plugin => plugin.slug === ref.plugin),
      )
    : filteredCategories;

  validateFinalState(
    { categories: finalCategories, plugins: filteredPlugins },
    { categories: rcCategories, plugins: rcPlugins },
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
): CoreConfig['categories'] {
  if (
    (skipCategories.length === 0 && onlyCategories.length === 0) ||
    !categories ||
    categories.length === 0
  ) {
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
): CoreConfig['plugins'] {
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
}: Filterables): CoreConfig['plugins'] {
  if (!categories || categories.length === 0) {
    return plugins;
  }
  const validPluginSlugs = new Set(
    categories.flatMap(category => category.refs.map(ref => ref.plugin)),
  );
  return plugins.filter(plugin => validPluginSlugs.has(plugin.slug));
}

function filterSkippedItems<T extends { isSkipped?: boolean }>(
  items: T[] | undefined,
): Omit<T, 'isSkipped'>[] {
  return (items ?? [])
    .filter(({ isSkipped }) => isSkipped !== true)
    .map(({ isSkipped, ...props }) => props);
}

export function processPlugins(plugins: PluginConfig[]): PluginConfig[] {
  return plugins.map((plugin: PluginConfig) => {
    const filteredAudits = filterSkippedItems(plugin.audits);
    return {
      ...plugin,
      ...(plugin.groups && {
        groups: filterItemRefsBy(filterSkippedItems(plugin.groups), ref =>
          filteredAudits.some(({ slug }) => slug === ref.slug),
        ),
      }),
      audits: filteredAudits,
    };
  });
}

export function filterSkippedCategories(
  categories: CoreConfig['categories'],
  plugins: CoreConfig['plugins'],
): CoreConfig['categories'] {
  return categories
    ?.map(category => {
      const validRefs = category.refs.filter(ref =>
        isValidCategoryRef(ref, plugins),
      );
      return validRefs.length > 0 ? { ...category, refs: validRefs } : null;
    })
    .filter((category): category is CategoryConfig => category != null);
}
