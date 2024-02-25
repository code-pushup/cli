import { autoloadRc, readRcByPath } from '@code-pushup/core';
import {
  CoreConfig,
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
  uploadConfigSchema,
} from '@code-pushup/models';
import { CoreConfigCliOptions } from './core-config.model';
import { GeneralCliOptions } from './global.model';
import { OnlyPluginsOptions } from './only-plugins.model';

export async function coreConfigMiddleware<
  T extends GeneralCliOptions & CoreConfigCliOptions & OnlyPluginsOptions,
>(
  processArgs: T,
): Promise<GeneralCliOptions & CoreConfig & OnlyPluginsOptions> {
  const {
    config,
    tsconfig,
    persist: cliPersist,
    upload: cliUpload,
    ...remainingCliOptions
  } = processArgs;

  // Search for possible configuration file extensions if path is not given
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
    ...(upload != null && { upload }),
    ...remainingRcConfig,
    ...remainingCliOptions,
    persist: {
      outputDir:
        cliPersist?.outputDir ?? rcPersist?.outputDir ?? PERSIST_OUTPUT_DIR,
      format: cliPersist?.format ?? rcPersist?.format ?? PERSIST_FORMAT,
      filename: cliPersist?.filename ?? rcPersist?.filename ?? PERSIST_FILENAME,
    },
    categories: rcCategories ?? []
  };
}
