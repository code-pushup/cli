import { readCodePushupConfig } from '@code-pushup/core';
import {
  CoreConfig,
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
} from '@code-pushup/models';
import { GeneralCliOptions } from './global.model';

export async function coreConfigMiddleware<
  T extends Partial<GeneralCliOptions & CoreConfig>,
>(processArgs: T) {
  const args = processArgs;
  const {
    config,
    persist: cliPersist,
    upload: cliUpload,
    ...remainingCliOptions
  } = args as GeneralCliOptions & Required<CoreConfig>;
  const rcOptions = await readCodePushupConfig(config);
  const {
    persist: rcPersist,
    upload: rcUpload,
    categories: rcCategories = [],
    ...remainingRcConfig
  } = rcOptions;

  const parsedProcessArgs: CoreConfig & GeneralCliOptions = {
    config,
    ...remainingRcConfig,
    ...remainingCliOptions,
    upload: {
      ...rcUpload,
      ...cliUpload,
    },
    persist: {
      outputDir:
        cliPersist?.outputDir ?? rcPersist?.outputDir ?? PERSIST_OUTPUT_DIR,
      format: cliPersist?.format ?? rcPersist?.format ?? PERSIST_FORMAT,
      filename: cliPersist?.filename ?? rcPersist?.filename ?? PERSIST_FILENAME,
    },
    categories: rcCategories,
  };

  return parsedProcessArgs;
}
