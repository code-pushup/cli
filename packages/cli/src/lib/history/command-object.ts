import chalk from 'chalk';
import { join } from 'path';
import { CommandModule } from 'yargs';
import {
  CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from '@code-pushup/core';
import { Report } from '@code-pushup/models';
import {
  getCurrentBranchOrTag,
  git,
  guardAgainstDirtyRepo,
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

      const reports: Report[] = [];
      for (const commit of commitsToAudit) {
        await git.checkout(commit);
        const activeBranch = await getCurrentBranchOrTag();
        console.log('Current Branch:', activeBranch);

        const report = await collectAndPersistReports({
          ...config,
          persist: {
            ...config.persist,
            filename: `${commit}-report`,
          },
        });
        reports.push({
          report: join(config.persist.outputDir, config.persist.filename),
        } as any);

        // ensureCleanGit
        await guardAgainstDirtyRepo();
      }

      await git.checkout(current);
      console.log('Current Branch:', current);
      console.log('Reports:', reports);
    },
  } satisfies CommandModule;
}
