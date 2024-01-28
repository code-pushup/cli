import chalk from 'chalk';
import {CommandModule, Options} from 'yargs';
import {history} from '@code-pushup/core';
import {CoreConfig} from '@code-pushup/models';
import {git, guardAgainstDirtyRepo,} from '@code-pushup/utils';
import {CLI_NAME} from '../constants';
import {HistoryCliOptions} from './history.model';
import {yargsHistoryOptionsDefinition} from './history.options';
import {GeneralCliOptions} from "../implementation/global.model";

export function yargsHistoryCommandObject() {
  const command = 'history';
  return {
    command,
    describe: 'Create history of commits',
    builder: {
      ...yargsHistoryOptionsDefinition(),
    } satisfies Record<keyof HistoryCliOptions, Options>,
    handler: async (args) => {
      // eslint-disable-next-line no-console
      console.log(chalk.bold(CLI_NAME));
      // eslint-disable-next-line no-console
      console.log(chalk.gray(`Run ${command}`));

      const { targetBranch, gitRestore, numSteps, ...config } =
        args as unknown as HistoryCliOptions & CoreConfig & GeneralCliOptions;


      // git requires a clean history to check out a branch
      if (gitRestore) {
        await git.raw(['restore', '.']);
      }
      await guardAgainstDirtyRepo();

      // determine history to walk
      await git.checkout(targetBranch);
      const log = await git.log();
      const commitsToAudit = log.all
        .map(({ hash }) => hash)
        // crawl from oldest to newest
        .reverse()
        // adjust length
        .slice(-numSteps);

      // run history logic
      const reports: unknown[] = await history(
        config,
        commitsToAudit,
      );
      // eslint-disable-next-line no-console
      console.log('Reports:', reports.length);

    },
  } satisfies CommandModule;
}
