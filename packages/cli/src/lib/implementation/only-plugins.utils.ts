import chalk from 'chalk';
import type { CategoryConfig, PluginConfig } from '@code-pushup/models';
import { filterItemRefsBy, ui } from '@code-pushup/utils';

export function validateOnlyPluginsOption(
  {
    plugins,
    categories,
  }: {
    plugins: PluginConfig[];
    categories: CategoryConfig[];
  },
  {
    onlyPlugins = [],
    verbose = false,
  }: { onlyPlugins?: string[]; verbose?: boolean } = {},
): void {
  const onlyPluginsSet = new Set(onlyPlugins);
  const missingPlugins = onlyPlugins.filter(
    plugin => !plugins.some(({ slug }) => slug === plugin),
  );

  if (missingPlugins.length > 0 && verbose) {
    ui().logger.warning(
      `${chalk.yellow(
        '⚠',
      )} The --onlyPlugin argument references plugins with "${missingPlugins.join(
        '", "',
      )}" slugs, but no such plugins are present in the configuration. Expected one of the following plugin slugs: "${plugins
        .map(({ slug }) => slug)
        .join('", "')}".`,
    );
  }

  if (categories.length > 0) {
    const removedCategories = filterItemRefsBy(
      categories,
      ({ plugin }) => !onlyPluginsSet.has(plugin),
    );
    ui().logger.info(JSON.stringify(removedCategories, null, 2));
  }
}
