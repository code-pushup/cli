import { autoloadRc, readRcByPath } from '@code-pushup/core';
import {
  type CacheConfig,
  type CacheConfigObject,
  type CoreConfig,
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_FORMAT,
  DEFAULT_PERSIST_OUTPUT_DIR,
  type Format,
  uploadConfigSchema,
  validate,
} from '@code-pushup/models';
import { logger, pluralizeToken } from '@code-pushup/utils';
import type { CoreConfigCliOptions } from './core-config.model.js';
import type { FilterOptions } from './filter.model.js';
import type { GlobalOptions } from './global.model.js';

export type CoreConfigMiddlewareOptions = GlobalOptions &
  CoreConfigCliOptions &
  FilterOptions;

function buildPersistConfig(
  cliPersist: CoreConfigCliOptions['persist'],
  rcPersist: CoreConfig['persist'],
): Required<CoreConfig['persist']> {
  return {
    outputDir:
      cliPersist?.outputDir ??
      rcPersist?.outputDir ??
      DEFAULT_PERSIST_OUTPUT_DIR,
    filename:
      cliPersist?.filename ?? rcPersist?.filename ?? DEFAULT_PERSIST_FILENAME,
    format: normalizeFormats(
      cliPersist?.format ?? rcPersist?.format ?? DEFAULT_PERSIST_FORMAT,
    ),
    skipReports: cliPersist?.skipReports ?? rcPersist?.skipReports ?? false,
  };
}

export async function coreConfigMiddleware<
  T extends CoreConfigMiddlewareOptions,
>(processArgs: T): Promise<GlobalOptions & CoreConfig & FilterOptions> {
  const {
    config,
    tsconfig,
    persist: cliPersist,
    upload: cliUpload,
    cache: cliCache,
    ...remainingCliOptions
  } = processArgs;

  return logger.group('Loading configuration', async () => {
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
        : validate(uploadConfigSchema, { ...rcUpload, ...cliUpload });

    const result: GlobalOptions & CoreConfig & FilterOptions = {
      ...(config != null && { config }),
      cache: normalizeCache(cliCache),
      persist: buildPersistConfig(cliPersist, rcPersist),
      ...(upload != null && { upload }),
      ...remainingRcConfig,
      ...remainingCliOptions,
    };

    return {
      message: `Parsed config: ${summarizeConfig(result)}`,
      result,
    };
  });
}

function summarizeConfig(config: CoreConfig): string {
  return [
    pluralizeToken('plugin', config.plugins.length),
    pluralizeToken('category', config.categories?.length ?? 0),
    `upload ${config.upload ? 'enabled' : 'disabled'}`,
  ].join(', ');
}

export const normalizeCache = (cache?: CacheConfig): CacheConfigObject => {
  if (cache == null) {
    return { write: false, read: false };
  }
  if (typeof cache === 'boolean') {
    return { write: cache, read: cache };
  }
  return { write: cache.write ?? false, read: cache.read ?? false };
};

export const normalizeFormats = (formats?: string[]): Format[] =>
  (formats ?? []).flatMap(format => format.split(',') as Format[]);
