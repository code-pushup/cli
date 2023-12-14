import chalk from 'chalk';
import { writeFile } from 'node:fs/promises';
import { CommandModule } from 'yargs';
import { z } from 'zod';
import { HistoryOptions, history } from '@code-pushup/core';
import { getCurrentBranchOrTag, git } from '@code-pushup/utils';
import { CLI_NAME } from '../cli';

export function yargsHistoryCommandObject() {
  const command = 'history';
  return {
    command,
    describe: 'Create history of commits',
    builder: {
      targetBranch: {
        describe: 'Branch to crawl history of',
        type: 'string',
        default: 'main',
      },
    },
    handler: async args => {
      // eslint-disable-next-line no-console
      console.log(chalk.bold(CLI_NAME));
      // eslint-disable-next-line no-console
      console.log(chalk.gray(`Run ${command}...`));
      // await guardAgainstDirtyRepo();
      const { targetBranch, ...config } = args as unknown as HistoryOptions;

      // load upload configuration from environment
      const initialBranch: string = await getCurrentBranchOrTag();
      // eslint-disable-next-line no-console
      console.log('Initial Branch:', initialBranch);
      // eslint-disable-next-line no-console
      console.log('Target Branch:', targetBranch);

      await git.checkout(targetBranch);

      const log = await git.log();

      const commitsToAudit = log.all
        .map(({ hash }) => hash)
        // crawl from oldest to newest
        .reverse();
      // eslint-disable-next-line no-console
      console.log('All Log:', commitsToAudit.length);

      const reports = await history(config, commitsToAudit.slice(-3));
      // eslint-disable-next-line no-console
      console.log('Reports:', reports.length);
      // await writeFile('history.json', JSON.stringify(reports, null, 2));
      /* */
      await git.checkout(initialBranch);
      // eslint-disable-next-line no-console
      console.log('Current Branch:', initialBranch);
    },
  } satisfies CommandModule;
}
