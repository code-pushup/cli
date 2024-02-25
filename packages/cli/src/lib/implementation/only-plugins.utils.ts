import chalk from 'chalk';
import type { PluginConfig } from '@code-pushup/models';

export function validateOnlyPluginsOption(
  plugins: PluginConfig[] = [],
  {
    onlyPlugins = [],
    verbose = false,
  }: { onlyPlugins?: string[]; verbose?: boolean } = {},
): void {
  const missingPlugins = onlyPlugins.filter(
    plugin => !plugins.some(({ slug }) => slug === plugin),
  );

  if (missingPlugins.length > 0 && verbose) {
    console.warn(
      `${chalk.yellow(
        '⚠',
      )} The --onlyPlugin argument references plugins with "${missingPlugins.join(
        '", "',
      )}" slugs, but no such plugins are present in the configuration. Expected one of the following plugin slugs: "${plugins
        .map(({ slug }) => slug)
        .join('", "')}".`,
    );
  }
}
