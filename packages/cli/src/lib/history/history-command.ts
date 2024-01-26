import chalk from 'chalk';
import { CommandModule } from 'yargs';
import { HistoryOptions, UploadOptions, history } from '@code-pushup/core';
import {
  getCurrentBranchOrTag,
  git,
  guardAgainstDirtyRepo,
} from '@code-pushup/utils';
import {CLI_NAME} from "../constants";

export type HistoryCommandOptions = {
  targetBranch: string;
  gitRestore: string;
  numSteps: number;
};

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
    },
    handler: async args => {
      // eslint-disable-next-line no-console
      console.log(chalk.bold(CLI_NAME));
      // eslint-disable-next-line no-console
      console.log(chalk.gray(`Run ${command} ${JSON.stringify(args)}`));
      // await guardAgainstDirtyRepo();
      const { targetBranch, gitRestore, numSteps, ...config } =
        args as unknown as HistoryCommandOptions;

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
        git.raw(['restore', '.']);
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
      // eslint-disable-next-line no-console

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
