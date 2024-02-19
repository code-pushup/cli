import { autoloadRc, readRcByPath } from '@code-pushup/core';
import {
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
  uploadConfigSchema,
} from '@code-pushup/models';
import { CoreConfigCliOptions } from './core-config.model';
import { GeneralCliOptions } from './global.model';

export async function coreConfigMiddleware<
  T extends Partial<GeneralCliOptions & CoreConfigCliOptions>,
>(processArgs: T) {
  const {
    config,
    tsconfig,
    persist: cliPersist,
    upload: cliUpload,
    ...remainingCliOptions
  } = processArgs;

  // if config path is given use it otherwise auto-load
  const importedRc = config
    ? await readRcByPath(config, tsconfig)
    : await autoloadRc(tsconfig);
  const {
    persist: rcPersist,
    upload: rcUpload,
    categories: rcCategories,
    ...remainingRcConfig
  } = importedRc;

  const upload =
    rcUpload == null && cliUpload == null
      ? undefined
      : uploadConfigSchema.parse({
          ...rcUpload,
          ...cliUpload,
        });

  return {
    ...(config != null && { config }),
    persist: {
      outputDir:
        cliPersist?.outputDir ?? rcPersist?.outputDir ?? PERSIST_OUTPUT_DIR,
      format: cliPersist?.format ?? rcPersist?.format ?? PERSIST_FORMAT,
      filename: cliPersist?.filename ?? rcPersist?.filename ?? PERSIST_FILENAME,
    },
    ...(upload != null && { upload }),
    categories: rcCategories ?? [],
    ...remainingRcConfig,
    ...remainingCliOptions,
  };
}
