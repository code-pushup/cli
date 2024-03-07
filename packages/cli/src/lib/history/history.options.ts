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
    skipUploads: {
      describe: 'Upload created reports',
      type: 'boolean',
      default: true,
    },
    maxCount: {
      // https://git-scm.com/docs/git-log#Documentation/git-log.txt---max-countltnumbergt
      describe: 'Number of steps in history',
      type: 'number',
      default: 1,
    },
    from: {
      // https://git-scm.com/docs/git-log#_description
      describe: 'hash to start in history',
      type: 'string'
    },
    to: {
      // https://git-scm.com/docs/git-log#_description
      describe: 'hash to start in history',
      type: 'string'
    }
  };
}
