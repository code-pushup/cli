import { autoloadRc, readRcByPath } from '@code-pushup/core';
import {
  CoreConfig,
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_FORMAT,
  DEFAULT_PERSIST_OUTPUT_DIR,
  Format,
  uploadConfigSchema,
} from '@code-pushup/models';
import { CoreConfigCliOptions } from './core-config.model';
import { GeneralCliOptions } from './global.model';
import { OnlyPluginsOptions } from './only-plugins.model';
import { SkipPluginsOptions } from './skip-plugins.model';

export type CoreConfigMiddlewareOptions = GeneralCliOptions &
  CoreConfigCliOptions &
  OnlyPluginsOptions &
  SkipPluginsOptions;

export async function coreConfigMiddleware<
  T extends CoreConfigMiddlewareOptions,
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
      format: normalizeFormats(
        cliPersist?.format ?? rcPersist?.format ?? DEFAULT_PERSIST_FORMAT,
      ),
    },
    ...(upload != null && { upload }),
    categories: rcCategories ?? [],
    ...remainingRcConfig,
    ...remainingCliOptions,
  };
}

export const normalizeFormats = (formats?: string[]): Format[] =>
  (formats ?? []).flatMap(format => format.split(',') as Format[]);
