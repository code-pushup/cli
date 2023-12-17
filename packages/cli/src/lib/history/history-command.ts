import chalk from 'chalk';
import {CommandModule} from 'yargs';
import {HistoryOptions, history} from '@code-pushup/core';
import {
  getCurrentBranchOrTag,
  git,
  guardAgainstDirtyRepo,
} from '@code-pushup/utils';
import {CLI_NAME} from '../cli';
import {multiselect} from './prompts';
import inquirer from "inquirer";

export type HistoryCommandOptions = {
  targetBranch: string;
  gitRestore: string;
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
        default: '.', // @TODO remove after debugging
      },
    },
    handler: async args => {
      // eslint-disable-next-line no-console
      console.log(chalk.bold(CLI_NAME));
      // eslint-disable-next-line no-console
      console.log(chalk.gray(`Run ${command}...`));
      // await guardAgainstDirtyRepo();
      const {targetBranch, gitRestore, ...config} =
        args as unknown as HistoryCommandOptions;

      // load upload configuration from environment
      const initialBranch: string = await getCurrentBranchOrTag();
      // eslint-disable-next-line no-console
      console.log('Initial Branch:', initialBranch);
      // eslint-disable-next-line no-console
      console.log('Target Branch:', targetBranch);
      await inquirer.prompt([{
        name: 'item',
        type: 'list',
        message: 'message',
        choices: async () => {
          return ['1'];
        },
        // default: '1'
      }]);
      return ;

      if (gitRestore) {
        git.raw(['restore', '.']);
      }

      await guardAgainstDirtyRepo();
      await git.checkout(targetBranch);

      const log = await git.log();

      const commitsToAudit = log.all
        .map(({hash}) => hash)
        // crawl from oldest to newest
        .reverse();
      // eslint-disable-next-line no-console
      console.log('All Log:', commitsToAudit.length);
      // eslint-disable-next-line no-console
      console.log('choices:', commitsToAudit.slice(-2));
      multiselect({
        name: 'targetCommit',
        message: 'Select:',
        choices: commitsToAudit.slice(-2).filter(v => !!v).map(s => s.toString())
      }).then(console.log)
      const reports: unknown[] = await history(
        args as unknown as HistoryOptions,
        commitsToAudit.slice(-3),
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
