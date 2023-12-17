import { readCodePushupConfig } from '@code-pushup/core';
import { CoreConfig, Format } from '@code-pushup/models';
import { GeneralCliOptions, OnlyPluginsOptions } from './model';
import {
  filterCategoryByOnlyPluginsOption,
  filterPluginsByOnlyPluginsOption,
  validateOnlyPluginsOption,
} from './only-plugins-utils';
import { coerceArray } from './utils';

export async function configMiddleware<
  T extends Partial<GeneralCliOptions & CoreConfig & OnlyPluginsOptions>,
>(processArgs: T) {
  const args = processArgs;
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
        ...importedRc.upload,
        ...cliOptions.upload,
      },
      persist: {
        ...importedRc?.persist,
        ...cliOptions.persist,
        format: coerceArray<Format>(cliOptions?.persist?.format),
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
