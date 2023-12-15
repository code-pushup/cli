import { Options } from 'yargs';
import {
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
  UPLOAD_SERVER,
} from '@code-pushup/models';
import { CoreConfigCliOptions } from './model';

type ArgNames = keyof CoreConfigCliOptions;
export function yargsCoreConfigOptionsDefinition(): Record<ArgNames, Options> {
  return {
    // persist
    'persist.outputDir': {
      describe: 'Directory for the produced reports',
      type: 'string',
      default: PERSIST_OUTPUT_DIR,
    },
    'persist.filename': {
      describe: 'Filename for the produced reports.',
      type: 'string',
      default: PERSIST_FILENAME,
    },
    'persist.format': {
      describe: 'Format of the report output. e.g. `md`, `json`',
      type: 'array',
      default: PERSIST_FORMAT,
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
      default: UPLOAD_SERVER,
    },
    'upload.apiKey': {
      describe: 'API key for the portal server',
      type: 'string',
    },
  };
}
