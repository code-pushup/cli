import { yellow } from 'ansis';
import type { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { filterItemRefsBy, ui } from '@code-pushup/utils';

export function validatePluginFilterOption(
  filterOption: 'onlyPlugins' | 'skipPlugins',
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
  const missingPlugins = pluginsToFilter.filter(
    plugin => !plugins.some(({ slug }) => slug === plugin),
  );

  const isSkipOption = filterOption === 'skipPlugins';

  const filterFunction = (plugin: string) =>
    isSkipOption
      ? pluginsToFilterSet.has(plugin)
      : !pluginsToFilterSet.has(plugin);

  if (missingPlugins.length > 0 && verbose) {
    ui().logger.info(
      `${yellow(
        '⚠',
      )} The --${filterOption} argument references plugins with "${missingPlugins.join(
        '", "',
      )}" slugs, but no such plugins are present in the configuration. Expected one of the following plugin slugs: "${plugins
        .map(({ slug }) => slug)
        .join('", "')}".`,
    );
  }

  if (categories.length > 0 && verbose) {
    const removedCategorySlugs = filterItemRefsBy(categories, ({ plugin }) =>
      filterFunction(plugin),
    ).map(({ slug }) => slug);
    ui().logger.info(
      `The --${filterOption} argument removed categories with "${removedCategorySlugs.join(
        '", "',
      )}" slugs.
    `,
    );
  }
}
