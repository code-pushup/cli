import type {
  CategoryConfig,
  CoreConfig,
  PluginConfig,
} from '@code-pushup/models';
import { filterItemRefsBy } from '@code-pushup/utils';
import {
  applyFilters,
  extractSkippedItems,
  filterPluginsFromCategories,
  filterSkippedItems,
  isValidCategoryRef,
} from './filter.middleware.utils.js';
import type { FilterOptions, Filterables } from './filter.model.js';
import {
  handleConflictingOptions,
  validateFilterOption,
  validateFinalState,
  validateSkippedCategories,
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

  const plugins = filterSkippedInPlugins(rcPlugins);
  const categories = filterSkippedCategories(rcCategories, plugins);

  if (
    skipCategories.length === 0 &&
    onlyCategories.length === 0 &&
    skipPlugins.length === 0 &&
    onlyPlugins.length === 0
  ) {
    if (rcCategories && categories) {
      validateSkippedCategories(rcCategories, categories, verbose);
    }
    return {
      ...originalProcessArgs,
      ...(categories && { categories }),
      plugins,
    };
  }

  handleConflictingOptions('categories', onlyCategories, skipCategories);
  handleConflictingOptions('plugins', onlyPlugins, skipPlugins);

  const skippedPlugins = extractSkippedItems(rcPlugins, plugins);
  const skippedCategories = extractSkippedItems(rcCategories, categories);

  const filteredCategories = applyCategoryFilters(
    { categories, plugins },
    skippedCategories,
    { skipCategories, onlyCategories, verbose },
  );
  const filteredPlugins = applyPluginFilters(
    { categories: filteredCategories, plugins },
    skippedPlugins,
    { skipPlugins, onlyPlugins, verbose },
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

function applyCategoryFilters(
  { categories, plugins }: Filterables,
  skippedCategories: string[],
  options: Pick<FilterOptions, 'skipCategories' | 'onlyCategories' | 'verbose'>,
): CoreConfig['categories'] {
  const { skipCategories = [], onlyCategories = [], verbose = false } = options;
  if (
    (skipCategories.length === 0 && onlyCategories.length === 0) ||
    ((!categories || categories.length === 0) && skippedCategories.length === 0)
  ) {
    return categories;
  }
  validateFilterOption(
    'skipCategories',
    { plugins, categories },
    { itemsToFilter: skipCategories, skippedItems: skippedCategories, verbose },
  );
  validateFilterOption(
    'onlyCategories',
    { plugins, categories },
    { itemsToFilter: onlyCategories, skippedItems: skippedCategories, verbose },
  );
  return applyFilters(categories ?? [], skipCategories, onlyCategories, 'slug');
}

function applyPluginFilters(
  { categories, plugins }: Filterables,
  skippedPlugins: string[],
  options: Pick<FilterOptions, 'skipPlugins' | 'onlyPlugins' | 'verbose'>,
): CoreConfig['plugins'] {
  const { skipPlugins = [], onlyPlugins = [], verbose = false } = options;
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
    { itemsToFilter: skipPlugins, skippedItems: skippedPlugins, verbose },
  );
  validateFilterOption(
    'onlyPlugins',
    { plugins: filteredPlugins, categories },
    { itemsToFilter: onlyPlugins, skippedItems: skippedPlugins, verbose },
  );
  return applyFilters(filteredPlugins, skipPlugins, onlyPlugins, 'slug');
}

export function filterSkippedInPlugins(
  plugins: PluginConfig[],
): PluginConfig[] {
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
