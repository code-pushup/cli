import chalk from 'chalk';
import { CommandModule, Options } from 'yargs';
import { HistoryOptions, UploadOptions, history } from '@code-pushup/core';
import {
  getCurrentBranchOrTag,
  git,
  guardAgainstDirtyRepo,
} from '@code-pushup/utils';
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
      // await guardAgainstDirtyRepo();
      const { targetBranch, gitRestore, numSteps, ...config } =
        args as unknown as HistoryCliOptions;

      const options = args as unknown as UploadOptions;
      if (!options.upload) {
        throw new Error('Upload configuration not set');
      }

      // load upload configuration from environment
      const initialBranch: string = await getCurrentBranchOrTag();
      // eslint-disable-next-line no-console
      console.log('Initial Branch:', initialBranch);
      // eslint-disable-next-line no-console
      console.log('Target Branch:', targetBranch);

      if (gitRestore) {
        await git.raw(['restore', '.']);
      }

      // git requires a clean history to check out a branch
      await guardAgainstDirtyRepo();
      await git.checkout(targetBranch);

      const log = await git.log();

      const commitsToAudit = log.all
        .map(({ hash }) => hash)
        // crawl from oldest to newest
        .reverse();
      // eslint-disable-next-line no-console
      console.log('All Log:', commitsToAudit.length);

      const reports: unknown[] = await history(
        config as unknown as HistoryOptions,
        commitsToAudit.slice(-numSteps),
      );
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
