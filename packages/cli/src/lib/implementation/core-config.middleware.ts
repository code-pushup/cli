import { readCodePushupConfig } from '@code-pushup/core';
import { CoreConfig } from '@code-pushup/models';
import { GeneralCliOptions } from './global.model';

export async function coreConfigMiddleware<
  T extends Partial<GeneralCliOptions & CoreConfig>,
>(processArgs: T) {
  const args = processArgs;
  const { config, ...cliOptions } = args as GeneralCliOptions &
    Required<CoreConfig>;
  const importedRc = await readCodePushupConfig(config);

  const parsedProcessArgs: CoreConfig & GeneralCliOptions = {
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
