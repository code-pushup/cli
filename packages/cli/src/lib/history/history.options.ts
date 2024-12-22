import type { Options } from 'yargs';
import type { HistoryCliOptions } from './history.model.js';

export function yargsHistoryOptionsDefinition(): Record<
  keyof HistoryCliOptions,
  Options
> {
  return {
    targetBranch: {
      describe: 'Branch to crawl history',
      type: 'string',
    },
    onlySemverTags: {
      describe: 'Skip commits not tagged with a semantic version',
      type: 'boolean',
      default: false,
    },
    forceCleanStatus: {
      describe:
        'If we reset the status to a clean git history forcefully or not.',
      type: 'boolean',
      default: false,
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
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      default: 5,
    },
    from: {
      // https://git-scm.com/docs/git-log#Documentation/git-log.txt-ltrevision-rangegt
      describe: 'hash to first commit in history',
      type: 'string',
    },
    to: {
      // https://git-scm.com/docs/git-log#Documentation/git-log.txt-ltrevision-rangegt
      describe: 'hash to last commit in history',
      type: 'string',
    },
  };
}
