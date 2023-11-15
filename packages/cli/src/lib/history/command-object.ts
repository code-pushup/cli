import chalk from 'chalk';
import { join } from 'path';
import { CommandModule } from 'yargs';
import {
  CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from '@code-pushup/core';
import {
  calcDuration,
  getCurrentBranchOrTag,
  getProgressBar,
  git,
  guardAgainstDirtyRepo,
  startDuration,
} from '@code-pushup/utils';
import { CLI_NAME } from '../cli';

export function yargsHistoryCommandObject() {
  const command = 'history';
  return {
    command,
    describe: 'Create history of commits',
    handler: async args => {
      console.log(chalk.bold(CLI_NAME));
      console.log(chalk.gray(`Run ${command}...`));
      const config = args as unknown as CollectAndPersistReportsOptions;

      await guardAgainstDirtyRepo();

      const current = await getCurrentBranchOrTag();
      console.log('Current Branch:', current);

      const tags = await git.tags();
      console.log('Tags:', tags.all);

      const log = await git.log();
      console.log('All Log:', log.all.length);

      const commitsToAudit = log.all
        .map(({ hash }) => hash)
        // crawl from oldest to newest
        .reverse();

      const reports: unknown[] = [];

      const progress = getProgressBar('CurrentCommit');
      // eslint-disable-next-line functional/no-loop-statements
      for (const commit of commitsToAudit) {
        progress.updateTitle(commit);
        progress.incrementInSteps(commitsToAudit.length);

        await git.checkout(commit);
        const activeBranch = await getCurrentBranchOrTag();
        console.log('Generating History:', activeBranch);

        const start = startDuration();
        await collectAndPersistReports({
          ...config,
          persist: {
            ...config.persist,
            format: [],
            filename: `${commit}-report`,
          },
        });
        reports.push({
          [join(config.persist.filename)]: {
            duration: calcDuration(start),
          },
        });
      }
      progress.endProgress('History generated!');

      await git.checkout(current);
      console.log('Current Branch:', current);
      console.log('Reports:', reports);
    },
  } satisfies CommandModule;
}
