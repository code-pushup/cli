import type {
  CategoryConfig,
  CategoryRef,
  PluginConfig,
} from '@code-pushup/models';
import {
  capitalize,
  filterItemRefsBy,
  pluralize,
  ui,
} from '@code-pushup/utils';
import type {
  FilterOptionType,
  FilterOptions,
  Filterables,
} from './filter.model.js';

export class OptionValidationError extends Error {}

export function validateFilterOption(
  option: FilterOptionType,
  { plugins, categories = [] }: Filterables,
  { itemsToFilter, verbose }: { itemsToFilter: string[]; verbose: boolean },
): void {
  const itemsToFilterSet = new Set(itemsToFilter);
  const validItems = isCategoryOption(option)
    ? categories
    : isPluginOption(option)
      ? plugins
      : [];
  const invalidItems = itemsToFilter.filter(
    item => !validItems.some(({ slug }) => slug === item),
  );

  const message = createValidationMessage(option, invalidItems, validItems);

  if (
    isOnlyOption(option) &&
    itemsToFilterSet.size > 0 &&
    itemsToFilterSet.size === invalidItems.length
  ) {
    throw new OptionValidationError(message);
  }

  if (invalidItems.length > 0) {
    ui().logger.warning(message);
  }

  if (isPluginOption(option) && categories.length > 0 && verbose) {
    const removedCategorySlugs = filterItemRefsBy(categories, ({ plugin }) =>
      isOnlyOption(option)
        ? !itemsToFilterSet.has(plugin)
        : itemsToFilterSet.has(plugin),
    ).map(({ slug }) => slug);

    if (removedCategorySlugs.length > 0) {
      ui().logger.info(
        `The --${option} argument removed the following categories: ${removedCategorySlugs.join(
          ', ',
        )}.`,
      );
    }
  }
}

export function validateFilteredCategories(
  originalCategories: NonNullable<Filterables['categories']>,
  filteredCategories: NonNullable<Filterables['categories']>,
  {
    onlyCategories,
    skipCategories,
    verbose,
  }: Pick<FilterOptions, 'onlyCategories' | 'skipCategories' | 'verbose'>,
): void {
  const skippedCategories = originalCategories.filter(
    original => !filteredCategories.some(({ slug }) => slug === original.slug),
  );
  if (verbose) {
    skippedCategories.forEach(category => {
      ui().logger.info(
        `Category ${category.slug} was removed because all its refs were skipped. Affected refs: ${category.refs
          .map(ref => `${ref.slug} (${ref.type})`)
          .join(', ')}`,
      );
    });
  }
  const invalidArgs = [
    { option: 'onlyCategories', args: onlyCategories ?? [] },
    { option: 'skipCategories', args: skipCategories ?? [] },
  ].filter(({ args }) =>
    args.some(arg => skippedCategories.some(({ slug }) => slug === arg)),
  );
  if (invalidArgs.length > 0) {
    throw new OptionValidationError(
      invalidArgs
        .map(
          ({ option, args }) =>
            `The --${option} argument references skipped categories: ${args.join(', ')}`,
        )
        .join('. '),
    );
  }
  if (filteredCategories.length === 0) {
    throw new OptionValidationError(
      `No categories remain after filtering. Removed categories: ${skippedCategories
        .map(({ slug }) => slug)
        .join(', ')}`,
    );
  }
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

export function validateFinalState(
  filteredItems: Filterables,
  originalItems: Filterables,
): void {
  const { categories: filteredCategories = [], plugins: filteredPlugins } =
    filteredItems;
  const { categories: originalCategories = [], plugins: originalPlugins } =
    originalItems;
  if (
    filteredCategories.length === 0 &&
    filteredPlugins.length === 0 &&
    (originalPlugins.length > 0 || originalCategories.length > 0)
  ) {
    const availablePlugins =
      originalPlugins.map(p => p.slug).join(', ') || 'none';
    const availableCategories =
      originalCategories.map(c => c.slug).join(', ') || 'none';
    throw new OptionValidationError(
      `Nothing to report. No plugins or categories are available after filtering. Available plugins: ${availablePlugins}. Available categories: ${availableCategories}.`,
    );
  }
  if (filteredPlugins.every(pluginHasZeroWeightRefs)) {
    throw new OptionValidationError(
      `All groups in the filtered plugins have refs with zero weight. Please adjust your filters or weights.`,
    );
  }
}

export function pluginHasZeroWeightRefs(
  plugin: Pick<PluginConfig, 'groups' | 'audits'>,
): boolean {
  if (!plugin.groups || plugin.groups.length === 0) {
    return false;
  }
  const weightMap = new Map<string, number>();
  plugin.groups.forEach(group => {
    group.refs.forEach(ref => {
      weightMap.set(ref.slug, (weightMap.get(ref.slug) ?? 0) + ref.weight);
    });
  });
  const totalWeight = plugin.audits.reduce(
    (sum, audit) => sum + (weightMap.get(audit.slug) ?? 0),
    0,
  );
  return totalWeight === 0;
}

function isCategoryOption(option: FilterOptionType): boolean {
  return option.endsWith('Categories');
}

function isPluginOption(option: FilterOptionType): boolean {
  return option.endsWith('Plugins');
}

export function isOnlyOption(option: FilterOptionType): boolean {
  return option.startsWith('only');
}

export function getItemType(option: FilterOptionType, count: number): string {
  const itemType = isCategoryOption(option)
    ? 'category'
    : isPluginOption(option)
      ? 'plugin'
      : 'item';
  return pluralize(itemType, count);
}

export function createValidationMessage(
  option: FilterOptionType,
  invalidItems: string[],
  validItems: Pick<PluginConfig | CategoryConfig, 'slug'>[],
): string {
  const invalidItem = getItemType(option, invalidItems.length);
  const invalidItemText =
    invalidItems.length === 1
      ? `a ${invalidItem} that does not exist:`
      : `${invalidItem} that do not exist:`;
  const invalidSlugs = invalidItems.join(', ');

  const validItem = getItemType(option, validItems.length);
  const validItemText =
    validItems.length === 1
      ? `The only valid ${validItem} is`
      : `Valid ${validItem} are`;
  const validSlugs = validItems.map(({ slug }) => slug).join(', ');

  return `The --${option} argument references ${invalidItemText} ${invalidSlugs}. ${validItemText} ${validSlugs}.`;
}

export function handleConflictingOptions(
  type: 'categories' | 'plugins',
  onlyItems: string[],
  skipItems: string[],
): void {
  const conflictingItems = onlyItems.filter(item => skipItems.includes(item));

  if (conflictingItems.length > 0) {
    const conflictSubject = () => {
      switch (type) {
        case 'categories':
          return conflictingItems.length > 1 ? 'categories are' : 'category is';
        case 'plugins':
          return conflictingItems.length > 1 ? 'plugins are' : 'plugin is';
      }
    };

    const conflictingSlugs = conflictingItems.join(', ');

    throw new OptionValidationError(
      `The following ${conflictSubject()} specified in both --only${capitalize(
        type,
      )} and --skip${capitalize(
        type,
      )}: ${conflictingSlugs}. Please choose one option.`,
    );
  }
}
