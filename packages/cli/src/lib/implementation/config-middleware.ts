import { readRc, readRcByPath } from '@code-pushup/core';
import { CoreConfig } from '@code-pushup/models';
import { GeneralCliOptions, OnlyPluginsOptions } from './model';
import {
  filterCategoryByOnlyPluginsOption,
  filterPluginsByOnlyPluginsOption,
  validateOnlyPluginsOption,
} from './only-plugins-utils';

export async function configMiddleware<
  T extends Partial<GeneralCliOptions & CoreConfig & OnlyPluginsOptions>,
>(processArgs: T) {
  const args = processArgs;
  const { config, ...cliOptions } = args as GeneralCliOptions &
    Required<CoreConfig> &
    OnlyPluginsOptions;

  // if config path is given use it otherwise auto-load
  const importedRc = config ? await readRcByPath(config) : await readRc();

  validateOnlyPluginsOption(importedRc.plugins, cliOptions);

  const parsedProcessArgs: CoreConfig & GeneralCliOptions & OnlyPluginsOptions =
    {
      config,
      progress: cliOptions.progress,
      verbose: cliOptions.verbose,
      upload: {
        ...importedRc.upload,
        ...cliOptions.upload,
      },
      persist: {
        ...importedRc.persist,
        ...cliOptions.persist,
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
