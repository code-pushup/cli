import type { PluginConfig } from '@code-pushup/models';
import {
  capitalize,
  filterItemRefsBy,
  logger,
  pluralize,
} from '@code-pushup/utils';
import type { FilterOptionType, Filterables } from './filter.model.js';

export class OptionValidationError extends Error {}

// eslint-disable-next-line max-lines-per-function
export function validateFilterOption(
  option: FilterOptionType,
  { plugins, categories = [] }: Filterables,
  {
    itemsToFilter,
    skippedItems,
  }: { itemsToFilter: string[]; skippedItems: string[] },
): void {
  const validItems = isCategoryOption(option)
    ? categories.map(({ slug }) => slug)
    : isPluginOption(option)
      ? plugins.map(({ slug }) => slug)
      : [];

  const itemsToFilterSet = new Set(itemsToFilter);
  const skippedItemsSet = new Set(skippedItems);
  const validItemsSet = new Set(validItems);

  const nonExistentItems = itemsToFilter.filter(
    item => !validItemsSet.has(item) && !skippedItemsSet.has(item),
  );
  const skippedValidItems = itemsToFilter.filter(item =>
    skippedItemsSet.has(item),
  );

  if (nonExistentItems.length > 0) {
    const message = createValidationMessage(
      option,
      nonExistentItems,
      validItemsSet,
    );
    if (
      isOnlyOption(option) &&
      itemsToFilterSet.size > 0 &&
      itemsToFilterSet.size === nonExistentItems.length
    ) {
      throw new OptionValidationError(message);
    }
    logger.warn(message);
  }
  if (skippedValidItems.length > 0 && logger.isVerbose()) {
    const item = getItemType(option, skippedValidItems.length);
    const prefix = skippedValidItems.length === 1 ? `a skipped` : `skipped`;
    logger.warn(
      `The --${option} argument references ${prefix} ${item}: ${skippedValidItems.join(', ')}.`,
    );
  }
  if (isPluginOption(option) && categories.length > 0 && logger.isVerbose()) {
    const removedCategories = filterItemRefsBy(categories, ({ plugin }) =>
      isOnlyOption(option)
        ? !itemsToFilterSet.has(plugin)
        : itemsToFilterSet.has(plugin),
    ).map(({ slug }) => slug);

    if (removedCategories.length > 0) {
      logger.info(
        `The --${option} argument removed the following categories: ${removedCategories.join(
          ', ',
        )}.`,
      );
    }
  }
}

export function validateSkippedCategories(
  originalCategories: NonNullable<Filterables['categories']>,
  filteredCategories: NonNullable<Filterables['categories']>,
): void {
  const skippedCategories = originalCategories.filter(
    original => !filteredCategories.some(({ slug }) => slug === original.slug),
  );
  if (skippedCategories.length > 0 && logger.isVerbose()) {
    skippedCategories.forEach(category => {
      logger.info(
        `Category ${category.slug} was removed because all its refs were skipped. Affected refs: ${category.refs
          .map(ref => `${ref.slug} (${ref.type})`)
          .join(', ')}`,
      );
    });
  }
  if (filteredCategories.length === 0) {
    throw new OptionValidationError(
      `No categories remain after filtering. Removed categories: ${skippedCategories
        .map(({ slug }) => slug)
        .join(', ')}`,
    );
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
  if (filteredPlugins.some(pluginHasZeroWeightRefs)) {
    throw new OptionValidationError(
      'Some groups in the filtered plugins have only zero-weight references. Please adjust your filters or weights.',
    );
  }
}

export function pluginHasZeroWeightRefs(
  plugin: Pick<PluginConfig, 'groups' | 'audits'>,
): boolean {
  if (!plugin.groups || plugin.groups.length === 0) {
    return false;
  }
  return plugin.groups.some(
    group => group.refs.reduce((sum, ref) => sum + ref.weight, 0) === 0,
  );
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
  validItems: Set<string>,
): string {
  const invalidItem = getItemType(option, invalidItems.length);
  const invalidItemText =
    invalidItems.length === 1
      ? `a ${invalidItem} that does not exist:`
      : `${invalidItem} that do not exist:`;
  const invalidSlugs = invalidItems.join(', ');

  const validItem = getItemType(option, validItems.size);
  const validItemText =
    validItems.size === 1
      ? `The only valid ${validItem} is`
      : `Valid ${validItem} are`;
  const validSlugs = [...validItems].join(', ');

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
