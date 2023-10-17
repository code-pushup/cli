import { readCodePushupConfig } from '@code-pushup/core';
import {
  CoreConfig,
  GlobalOptions,
  globalOptionsSchema,
} from '@code-pushup/models';
import { CommandBase, GeneralCliOptions } from './model';

export async function configMiddleware<
  T extends GeneralCliOptions & CoreConfig,
>(processArgs: T) {
  const args = processArgs as T;
  const { config, ...cliOptions }: GlobalOptions =
    globalOptionsSchema.parse(args);
  const importedRc = await readCodePushupConfig(config);
  const parsedProcessArgs: CommandBase = {
    ...cliOptions,
    ...(importedRc || {}),
    upload: {
      ...importedRc?.upload,
      ...args?.upload,
    },
    persist: {
      ...importedRc.persist,
      ...args?.persist,
    },
    plugins: importedRc.plugins,
    categories: importedRc.categories,
  };

  return parsedProcessArgs;
}
