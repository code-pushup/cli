import { autoloadRc, readRcByPath } from '@code-pushup/core';
import { CoreConfig } from '@code-pushup/models';
import { GeneralCliOptions } from './global.model';
import { OnlyPluginsOptions } from './only-plugins.model';

export async function coreConfigMiddleware<
  T extends Partial<GeneralCliOptions & CoreConfig & OnlyPluginsOptions>,
>(processArgs: T) {
  const args = processArgs;
  const { config, ...cliOptions } = args as GeneralCliOptions &
    Required<CoreConfig> &
    OnlyPluginsOptions;

  // if config path is given use it otherwise auto-load
  const importedRc = config ? await readRcByPath(config) : await autoloadRc();

  const parsedProcessArgs: CoreConfig & GeneralCliOptions & OnlyPluginsOptions =
    {
      config,
      ...importedRc,
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
