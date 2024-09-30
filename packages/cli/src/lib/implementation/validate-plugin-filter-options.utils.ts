import type { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { filterItemRefsBy, ui } from '@code-pushup/utils';

export class OptionValidationError extends Error {
  constructor(message: string) {
    super(`${message}`);
  }
}

export function validatePluginFilterOption(
  option: 'onlyPlugins' | 'skipPlugins',
  {
    plugins,
    categories,
  }: {
    plugins: PluginConfig[];
    categories: CategoryConfig[];
  },
  {
    pluginsToFilter = [],
    verbose = false,
  }: { pluginsToFilter?: string[]; verbose?: boolean } = {},
): void {
  const pluginsToFilterSet = new Set(pluginsToFilter);
  const invalidPlugins = pluginsToFilter.filter(
    plugin => !plugins.some(({ slug }) => slug === plugin),
  );
  const message = createValidationMessage(option, invalidPlugins, plugins);

  const filterFn = (plugin: string) =>
    option === 'skipPlugins'
      ? pluginsToFilterSet.has(plugin)
      : !pluginsToFilterSet.has(plugin);

  if (
    option === 'onlyPlugins' &&
    pluginsToFilterSet.size > 0 &&
    pluginsToFilterSet.size === invalidPlugins.length
  ) {
    throw new OptionValidationError(message);
  }

  if (invalidPlugins.length > 0) {
    ui().logger.warning(message);
  }

  if (categories.length > 0 && verbose) {
    const removedCategorySlugs = filterItemRefsBy(categories, ({ plugin }) =>
      filterFn(plugin),
    ).map(({ slug }) => slug);
    ui().logger.info(
      `The --${option} argument removed the following categories: ${removedCategorySlugs.join(
        ', ',
      )}.`,
    );
  }
}

export function createValidationMessage(
  option: 'onlyPlugins' | 'skipPlugins',
  invalidPlugins: string[],
  validPlugins: Pick<PluginConfig, 'slug'>[],
): string {
  const invalidPluginText =
    invalidPlugins.length === 1
      ? 'a plugin that does not exist:'
      : 'plugins that do not exist:';
  const invalidSlugs = invalidPlugins.join(', ');

  const validPluginText =
    validPlugins.length === 1
      ? 'The only valid plugin is'
      : 'Valid plugins are';
  const validSlugs = validPlugins.map(({ slug }) => slug).join(', ');

  return `The --${option} argument references ${invalidPluginText} ${invalidSlugs}. ${validPluginText} ${validSlugs}.`;
}

export function handleConflictingPlugins(
  onlyPlugins: string[],
  skipPlugins: string[],
): void {
  const conflictingPlugins = onlyPlugins.filter(plugin =>
    skipPlugins.includes(plugin),
  );

  if (conflictingPlugins.length > 0) {
    const conflictSubject =
      conflictingPlugins.length > 1 ? 'plugins are' : 'plugin is';
    const conflictingSlugs = conflictingPlugins.join(', ');

    throw new OptionValidationError(
      `The following ${conflictSubject} specified in both --onlyPlugins and --skipPlugins: ${conflictingSlugs}. Please choose one option.`,
    );
  }
}
