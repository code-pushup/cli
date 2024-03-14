import chalk from 'chalk';
import { simpleGit } from 'simple-git';
import { CommandModule } from 'yargs';
import { HistoryOptions, history } from '@code-pushup/core';
import { getCurrentBranchOrTag, safeCheckout, ui } from '@code-pushup/utils';
import { CLI_NAME } from '../constants';
import { yargsOnlyPluginsOptionsDefinition } from '../implementation/only-plugins.options';
import { HistoryCliOptions } from './history.model';
import { yargsHistoryOptionsDefinition } from './history.options';

export function yargsHistoryCommandObject() {
  const command = 'history';
  return {
    command,
    describe: 'Create history of commits',
    builder: yargs => {
      yargs.options({
        ...yargsHistoryOptionsDefinition(),
        ...yargsOnlyPluginsOptionsDefinition(),
      });
      yargs.group(
        Object.keys(yargsHistoryOptionsDefinition()),
        'History Options:',
      );
      return yargs;
    },
    handler: async args => {
      ui().logger.info(chalk.bold(CLI_NAME));
      ui().logger.info(chalk.gray(`Run ${command}`));

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
      ui().logger.log(`Reports: ', ${reports.length}`);
    },
  } satisfies CommandModule;
}
