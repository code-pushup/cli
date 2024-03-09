import chalk from 'chalk';
import { simpleGit } from 'simple-git';
import { CommandModule, Options } from 'yargs';
import { HistoryOptions, history } from '@code-pushup/core';
import { getCurrentBranchOrTag, safeCheckout } from '@code-pushup/utils';
import { CLI_NAME } from '../constants';
import { yargsOnlyPluginsOptionsDefinition } from '../implementation/only-plugins.options';
import { HistoryCliOptions } from './history.model';
import { yargsHistoryOptionsDefinition } from './history.options';

export function yargsHistoryCommandObject() {
  const command = 'history';
  return {
    command,
    describe: 'Create history of commits',
    builder: {
      ...yargsOnlyPluginsOptionsDefinition(),
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
        maxCount,
        from,
        to,
        ...restOptions
      } = args as unknown as HistoryCliOptions & HistoryOptions;

      // determine history to walk
      const git = simpleGit();
      const log = await git.log({ maxCount, from, to });
      const commitsToAudit = log.all
        .map(({ hash }) => hash)
        // crawl from oldest to newest
        .reverse();

      // run history logic
      const reports: unknown[] = await history(
        {
          ...restOptions,
          targetBranch,
          forceCleanStatus,
        },
        commitsToAudit,
      );

      // go back to initial branch
      await safeCheckout(currentBranch);

      // eslint-disable-next-line no-console
      console.log('Reports:', reports.length);
    },
  } satisfies CommandModule;
}
