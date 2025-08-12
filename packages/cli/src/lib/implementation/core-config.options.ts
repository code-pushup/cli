import type { Options } from 'yargs';
import type {
  CacheConfigCliOptions,
  PersistConfigCliOptions,
  UploadConfigCliOptions,
} from './core-config.model.js';

export function yargsCoreConfigOptionsDefinition(): Record<
  keyof (PersistConfigCliOptions &
    UploadConfigCliOptions &
    CacheConfigCliOptions),
  Options
> {
  return {
    ...yargsPersistConfigOptionsDefinition(),
    ...yargsUploadConfigOptionsDefinition(),
    ...yargsCacheConfigOptionsDefinition(),
  };
}

export function yargsPersistConfigOptionsDefinition(): Record<
  keyof PersistConfigCliOptions,
  Options
> {
  return {
    'persist.outputDir': {
      describe: 'Directory for the produced reports',
      type: 'string',
    },
    'persist.filename': {
      describe: 'Filename for the produced reports.',
      type: 'string',
    },
    'persist.format': {
      describe: 'Format of the report output. e.g. `md`, `json`',
      type: 'array',
    },
    'persist.skipReports': {
      describe:
        'Skip generating report files. (useful in combination with caching)',
      type: 'boolean',
    },
  };
}

export function yargsUploadConfigOptionsDefinition(): Record<
  keyof UploadConfigCliOptions,
  Options
> {
  return {
    'upload.organization': {
      describe: 'Organization slug from portal',
      type: 'string',
    },
    'upload.project': {
      describe: 'Project slug from portal',
      type: 'string',
    },
    'upload.server': {
      describe: 'URL to your portal server',
      type: 'string',
    },
    'upload.apiKey': {
      describe: 'API key for the portal server',
      type: 'string',
    },
  };
}

export function yargsCacheConfigOptionsDefinition(): Record<
  keyof CacheConfigCliOptions,
  Options
> {
  return {
    cache: {
      describe: 'Cache runner outputs (both read and write)',
      type: 'boolean',
    },
    'cache.read': {
      describe: 'Read runner-output.json to file system',
      type: 'boolean',
    },
    'cache.write': {
      describe: 'Write runner-output.json to file system',
      type: 'boolean',
    },
  };
}
