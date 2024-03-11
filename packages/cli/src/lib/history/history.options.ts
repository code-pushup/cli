import { Options } from 'yargs';
import { HistoryCliOptions } from './history.model';

export function yargsHistoryOptionsDefinition(): Record<
  keyof HistoryCliOptions,
  Options
> {
  return {
    targetBranch: {
      describe: 'Branch to crawl history',
      type: 'string',
      default: 'main',
    },
    forceCleanStatus: {
      describe:
        'If we reset the status to a clean git history forcefully or not.',
      type: 'boolean',
    },
    skipUploads: {
      describe: 'Upload created reports',
      type: 'boolean',
      default: false,
    },
    maxCount: {
      // https://git-scm.com/docs/git-log#Documentation/git-log.txt---max-countltnumbergt
      describe: 'Number of steps in history',
      type: 'number',
      // eslint-disable-next-line no-magic-numbers
      default: 5,
    },
    from: {
      // https://git-scm.com/docs/git-log#_description
      describe: 'hash to start in history',
      type: 'string',
    },
    to: {
      // https://git-scm.com/docs/git-log#_description
      describe: 'hash to start in history',
      type: 'string',
    },
  };
}
