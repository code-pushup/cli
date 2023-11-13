import chalk from 'chalk';
import { readCodePushupConfig } from '@code-pushup/core';
import { CoreConfig } from '@code-pushup/models';
import { GeneralCliOptions } from './model';
import { OnlyPluginsOptions } from './only-plugins-options';

export async function configMiddleware<
  T extends Partial<GeneralCliOptions & CoreConfig & OnlyPluginsOptions>,
>(processArgs: T) {
  const args = processArgs as T;
  const { config, ...cliOptions } = args as GeneralCliOptions &
    Required<CoreConfig> &
    OnlyPluginsOptions;
  const importedRc = await readCodePushupConfig(config);

  validateOnlyPluginsOption(importedRc.plugins, cliOptions);

  const parsedProcessArgs: CoreConfig & GeneralCliOptions & OnlyPluginsOptions =
    {
      config,
      progress: cliOptions.progress,
      verbose: cliOptions.verbose,
      upload: {
        ...importedRc?.upload,
        ...cliOptions?.upload,
      },
      persist: {
        ...importedRc.persist,
        ...cliOptions?.persist,
      },
      plugins: filterPluginsByOnlyPluginsOption(importedRc.plugins, cliOptions),
      categories: filterCategoryRefsByOnlyPluginsOption(
        importedRc.categories,
        cliOptions,
      ),
      onlyPlugins: cliOptions.onlyPlugins,
    };

  return parsedProcessArgs;
}

function filterPluginsByOnlyPluginsOption(
  plugins: CoreConfig['plugins'],
  { onlyPlugins }: { onlyPlugins?: string[] },
): CoreConfig['plugins'] {
  if (!onlyPlugins?.length) {
    return plugins;
  }
  return plugins.filter(plugin => onlyPlugins.includes(plugin.slug));
}

function filterCategoryRefsByOnlyPluginsOption(
  categoryRefs: CoreConfig['categories'],
  { onlyPlugins }: { onlyPlugins?: string[] },
): CoreConfig['categories'] {
  if (!onlyPlugins?.length) {
    return categoryRefs;
  }
  return categoryRefs.filter(categoryRef =>
    categoryRef.refs.some(ref => onlyPlugins.includes(ref.plugin)),
  );
}

function validateOnlyPluginsOption(
  plugins: CoreConfig['plugins'],
  { onlyPlugins }: { onlyPlugins?: string[] },
): void {
  const missingPlugins = onlyPlugins?.length
    ? onlyPlugins.filter(plugin => !plugins.some(({ slug }) => slug === plugin))
    : [];

  if (missingPlugins.length) {
    console.log(
      `${chalk.yellow(
        '⚠',
      )} The --onlyPlugin argument references plugins with "${missingPlugins.join(
        '", "',
      )}" slugs, but no such plugin is present in the configuration. Expected one of the following plugin slugs: "${plugins
        .map(({ slug }) => slug)
        .join('", "')}".`,
    );
  }
}
