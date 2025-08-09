import type { Options } from 'yargs';
import type {
  PersistConfigCliOptions,
  UploadConfigCliOptions,
} from './core-config.model.js';

export function yargsCoreConfigOptionsDefinition(): Record<
  keyof (PersistConfigCliOptions & UploadConfigCliOptions),
  Options
> {
  return {
    ...yargsPersistConfigOptionsDefinition(),
    ...yargsUploadConfigOptionsDefinition(),
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
    'persist.report': {
      describe:
        'Generate the report files for given formats. (useful in combination with caching)',
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
