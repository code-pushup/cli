import chalk from 'chalk';
import { simpleGit } from 'simple-git';
import { CommandModule, Options } from 'yargs';
import { HistoryOptions, history } from '@code-pushup/core';
import { getCurrentBranchOrTag, safeCheckout } from '@code-pushup/utils';
import { CLI_NAME } from '../constants';
import { HistoryCliOptions } from './history.model';
import { yargsHistoryOptionsDefinition } from './history.options';

export function yargsHistoryCommandObject() {
  const command = 'history';
  return {
    command,
    describe: 'Create history of commits',
    builder: {
      ...yargsHistoryOptionsDefinition(),
    } satisfies Record<keyof HistoryCliOptions, Options>,
    handler: async args => {
      // eslint-disable-next-line no-console
      console.log(chalk.bold(CLI_NAME));
      // eslint-disable-next-line no-console
      console.log(chalk.gray(`Run ${command}`));

      const currentBranch = await getCurrentBranchOrTag();
      const {
        targetBranch = currentBranch,
        forceCleanStatus,
        numSteps = 1,
        ...config
      } = args as unknown as HistoryCliOptions & HistoryOptions;

      // determine history to walk
      const git = simpleGit();
      const log = await git.log();
      const commitsToAudit = log.all
        .map(({ hash }) => hash)
        // crawl from oldest to newest
        .reverse()
        // adjust length
        .slice(-numSteps);

      // run history logic
      const reports: unknown[] = await history(
        {
          ...config,
          targetBranch,
          forceCleanStatus,
        },
        commitsToAudit,
      );

      await safeCheckout(currentBranch);

      // eslint-disable-next-line no-console
      console.log('Reports:', reports.length);
    },
  } satisfies CommandModule;
}
