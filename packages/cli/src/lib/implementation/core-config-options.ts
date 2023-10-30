import { Options } from 'yargs';
import { CoreConfigCliOptions } from './model';

type ArgNames = keyof CoreConfigCliOptions;
export function yargsCoreConfigOptionsDefinition(): Record<ArgNames, Options> {
  return {
    // persist
    'persist.outputDir': {
      describe: 'Directory for the produced reports',
      type: 'string',
    },
    'persist.format': {
      describe: 'Format of the report output. e.g. `md`, `json`, `stdout`',
      type: 'array',
    },
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
