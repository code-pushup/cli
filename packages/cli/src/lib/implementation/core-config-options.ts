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
    // update
    'upload.organization': {
      describe: 'organization name in your CVS',
      type: 'string',
    },
    'upload.project': {
      describe: 'project name in your CVS',
      type: 'string',
    },
    'upload.server': {
      describe: 'URL to your portal server',
      type: 'string',
    },
    'upload.apiKey': {
      describe: 'apiKey for the portal server',
      type: 'string',
    } /**/,
  }; //as unknown as Record<keyof ArgsCliObj, Options>;
}
