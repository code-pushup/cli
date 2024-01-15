import { readCodePushupConfig } from '@code-pushup/core';
import {
  CoreConfig,
  Format,
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
} from '@code-pushup/models';
import { GeneralCliOptions } from './global.model';
import { coerceArray } from './global.utils';

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
    // we can't use a async rc file as yargs does not support it. see: https://github.com/yargs/yargs/issues/2234
    // therefore this can't live in option defaults as the order would be `config`->`provided options`->default
    // so we have to manually implement the order
    persist: {
      outputDir:
        cliOptions.persist?.outputDir ||
        importedRc.persist?.outputDir ||
        PERSIST_OUTPUT_DIR,
      filename:
        cliOptions.persist?.filename ||
        importedRc.persist?.filename ||
        PERSIST_FILENAME,
      format: coerceArray<Format>(
        cliOptions.persist?.format ??
          importedRc.persist?.format ??
          PERSIST_FORMAT,
      ),
    },
  };

  return parsedProcessArgs;
}
