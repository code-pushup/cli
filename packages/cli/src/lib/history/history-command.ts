import chalk from 'chalk';
import { CommandModule, Options } from 'yargs';
import { HistoryOptions, history } from '@code-pushup/core';
import { CoreConfig } from '@code-pushup/models';
import { getCurrentBranchOrTag, git, safeCheckout } from '@code-pushup/utils';
import { CLI_NAME } from '../constants';
import { GeneralCliOptions } from '../implementation/global.model';
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
        gitRestore,
        numSteps = 1,
        ...config
      } = args as unknown as HistoryCliOptions & HistoryOptions;

      // determine history to walk
      await safeCheckout(targetBranch, { gitRestore });
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
          gitRestore,
        },
        commitsToAudit,
      );

      await safeCheckout(currentBranch);

      // eslint-disable-next-line no-console
      console.log('Reports:', reports.length);
    },
  } satisfies CommandModule;
}
