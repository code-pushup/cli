import { autoloadRc, readRcByPath } from '@code-pushup/core';
import {
  type CoreConfig,
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_FORMAT,
  DEFAULT_PERSIST_OUTPUT_DIR,
  type Format,
  uploadConfigSchema,
} from '@code-pushup/models';
import type { CoreConfigCliOptions } from './core-config.model.js';
import type { FilterOptions } from './filter.model.js';
import type { GeneralCliOptions } from './global.model.js';

export type CoreConfigMiddlewareOptions = GeneralCliOptions &
  CoreConfigCliOptions &
  FilterOptions;

export async function coreConfigMiddleware<
  T extends CoreConfigMiddlewareOptions,
>(processArgs: T): Promise<GeneralCliOptions & CoreConfig & FilterOptions> {
  const {
    config,
    tsconfig,
    persist: cliPersist,
    upload: cliUpload,
    cache: cliCache,
    ...remainingCliOptions
  } = processArgs;
  // Search for possible configuration file extensions if path is not given
  const importedRc = config
    ? await readRcByPath(config, tsconfig)
    : await autoloadRc(tsconfig);
  const {
    persist: rcPersist,
    upload: rcUpload,
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
    cache: {
      write: false,
      read: false,
      ...cliCache,
    },
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
    ...remainingRcConfig,
    ...remainingCliOptions,
  };
}

export const normalizeFormats = (formats?: string[]): Format[] =>
  (formats ?? []).flatMap(format => format.split(',') as Format[]);
