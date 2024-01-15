import { Options } from 'yargs';
import {
  CoreConfigCliOptions,
  PersistConfigCliOptions,
  UploadConfigCliOptions,
} from './core-config.model';

export function yargsCoreConfigOptionsDefinition(): Record<
  keyof CoreConfigCliOptions,
  Options
> {
  return {
    // persist
    ...yargsPersistConfigOptionsDefinition(),
    // upload
    ...yargsUploadConfigOptionsDefinition(),
  };
}

export function yargsPersistConfigOptionsDefinition(): Record<
  keyof PersistConfigCliOptions,
  Options
> {
  return {
    // persist
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
  };
}

export function yargsUploadConfigOptionsDefinition(): Record<
  keyof UploadConfigCliOptions,
  Options
> {
  return {
    // upload
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
