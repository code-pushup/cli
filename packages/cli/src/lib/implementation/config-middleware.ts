import { readCodePushupConfig } from '@code-pushup/core';
import { CoreConfig, GlobalOptions } from '@code-pushup/models';
import { GeneralCliOptions } from './model';

export async function configMiddleware<
  T extends Partial<GeneralCliOptions & CoreConfig>,
>(processArgs: T) {
  const args = processArgs as T;
  const { config, ...cliOptions } = args as GeneralCliOptions &
    Required<CoreConfig>;
  const importedRc = await readCodePushupConfig(config);
  const parsedProcessArgs: CoreConfig & GlobalOptions = {
    config,
    verbose: cliOptions.verbose,
    upload: {
      ...importedRc?.upload,
      ...cliOptions?.upload,
    },
    persist: {
      ...importedRc.persist,
      ...cliOptions?.persist,
    },
    plugins: importedRc.plugins,
    categories: importedRc.categories,
  };

  return parsedProcessArgs;
}
