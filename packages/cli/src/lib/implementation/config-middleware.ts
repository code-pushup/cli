import chalk from 'chalk';
import { readCodePushupConfig } from '@code-pushup/core';
import { CoreConfig } from '@code-pushup/models';
import { GeneralCliOptions, OnlyPluginsOptions } from './model';

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
      categories: filterCategoryByOnlyPluginsOption(
        importedRc.categories,
        cliOptions,
      ),
      onlyPlugins: cliOptions.onlyPlugins,
    };

  return parsedProcessArgs;
}

export function filterPluginsByOnlyPluginsOption(
  plugins: CoreConfig['plugins'],
  { onlyPlugins }: { onlyPlugins?: string[] },
): CoreConfig['plugins'] {
  if (!onlyPlugins?.length) {
    return plugins;
  }
  return plugins.filter(plugin => onlyPlugins.includes(plugin.slug));
}

// skip the whole category if it has at least one skipped plugin ref
// see https://github.com/code-pushup/cli/pull/246#discussion_r1392274281
export function filterCategoryByOnlyPluginsOption(
  categories: CoreConfig['categories'],
  { onlyPlugins }: { onlyPlugins?: string[] },
): CoreConfig['categories'] {
  if (!onlyPlugins?.length) {
    return categories;
  }

  return categories.filter(category =>
    category.refs.every(ref => {
      const isNotSkipped = onlyPlugins.includes(ref.slug);

      if (!isNotSkipped) {
        console.log(
          `${chalk.yellow('⚠')} Category "${
            category.title
          }" is ignored because it references audits from skipped plugin "${
            ref.slug
          }"`,
        );
      }

      return isNotSkipped;
    }),
  );
}

export function validateOnlyPluginsOption(
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
