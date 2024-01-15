import { readCodePushupConfig } from '@code-pushup/core';
import { CoreConfig } from '@code-pushup/models';
import { GeneralCliOptions, OnlyPluginsOptions } from './model';
import { validateOnlyPluginsOption } from './only-plugins.utils';

export async function configMiddleware<
  T extends Partial<GeneralCliOptions & CoreConfig & OnlyPluginsOptions>,
>(processArgs: T) {
  const args = processArgs;
  const { config, ...cliOptions } = args as GeneralCliOptions &
    Required<CoreConfig> &
    OnlyPluginsOptions;
  const importedRc: CoreConfig = await readCodePushupConfig(config);

  validateOnlyPluginsOption(importedRc.plugins, cliOptions);

  const parsedProcessArgs: CoreConfig & GeneralCliOptions & OnlyPluginsOptions =
    {
      config,
      ...cliOptions,
      upload: {
        ...importedRc.upload,
        ...cliOptions.upload,
      },
      persist: {
        ...importedRc.persist,
        ...cliOptions.persist,
      },
    };

  return parsedProcessArgs;
}
