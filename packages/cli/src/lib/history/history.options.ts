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
    gitRestore: {
      describe: 'Folder to restore using "git restore [folder]"',
      type: 'string',
      // default: '.', // @TODO remove after debugging
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
