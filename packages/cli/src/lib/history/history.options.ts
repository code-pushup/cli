import { Options } from 'yargs';
import { HistoryCliOptions } from './history.model';

export function yargsHistoryOptionsDefinition(): Record<
  keyof HistoryCliOptions,
  Options
> {
  return {
    targetBranch: {
      describe: 'Branch to crawl history of',
      type: 'string',
      default: 'main',
    },
    forceCleanStatus: {
      describe: 'Folder to restore using "git restore [folder]"',
      type: 'boolean',
    },
    numSteps: {
      describe: 'Number of steps in history',
      type: 'number',
      default: 1,
    },
    uploadReports: {
      describe: 'Upload created reports',
      type: 'boolean',
      default: true,
    },
  };
}
