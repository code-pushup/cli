import { readCodePushupConfig } from '@code-pushup/core';
import {
  CoreConfig,
  Format,
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
} from '@code-pushup/models';
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
      // we can't use a async rc file as yargs does not support it. see: https://github.com/yargs/yargs/issues/2234
      // therefore this can't live in option defaults as the order would be `config`->`provided options`->default
      // so we have to manually implement the order
      persist: {
        outputDir:
          cliOptions?.persist?.outputDir ||
          importedRc?.persist?.outputDir ||
          PERSIST_OUTPUT_DIR,
        filename:
          cliOptions?.persist?.filename ||
          importedRc?.persist?.filename ||
          PERSIST_FILENAME,
        format: coerceArray<Format>(
          cliOptions?.persist?.format ||
            importedRc?.persist?.format ||
            PERSIST_FORMAT,
        ),
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
