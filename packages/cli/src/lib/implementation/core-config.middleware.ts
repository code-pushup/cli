import { autoloadRc, readRcByPath } from '@code-pushup/core';
import {
  CoreConfig,
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_FORMAT,
  DEFAULT_PERSIST_OUTPUT_DIR,
  uploadConfigSchema,
} from '@code-pushup/models';
import { CoreConfigCliOptions } from './core-config.model';
import { GeneralCliOptions } from './global.model';
import { OnlyPluginsOptions } from './only-plugins.model';
import { SkipPluginsOptions } from './skip-plugins.model';

export async function coreConfigMiddleware<
  T extends GeneralCliOptions &
    CoreConfigCliOptions &
    OnlyPluginsOptions &
    SkipPluginsOptions,
>(
  processArgs: T,
): Promise<
  GeneralCliOptions & CoreConfig & OnlyPluginsOptions & SkipPluginsOptions
> {
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
    persist: {
      outputDir:
        cliPersist?.outputDir ??
        rcPersist?.outputDir ??
        DEFAULT_PERSIST_OUTPUT_DIR,
      filename:
        cliPersist?.filename ?? rcPersist?.filename ?? DEFAULT_PERSIST_FILENAME,
      format: cliPersist?.format ?? rcPersist?.format ?? DEFAULT_PERSIST_FORMAT,
    },
    ...(upload != null && { upload }),
    categories: rcCategories ?? [],
    ...remainingRcConfig,
    ...remainingCliOptions,
  };
}
