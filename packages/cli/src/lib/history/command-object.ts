import chalk from 'chalk';
import { join } from 'path';
import { CommandModule } from 'yargs';
import { writeFile } from 'fs/promises';
import {
  CollectAndPersistReportsOptions,
  UploadOptions,
  collectAndPersistReports,
  upload,
} from '@code-pushup/core';
import { CoreConfig } from '@code-pushup/models';
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
        const start = startDuration();
        const result: Record<string, unknown> = {
          commit,
          start,
        };
        progress.incrementInSteps(commitsToAudit.length);

        await git.checkout(commit);
        const commitConfig = {
          ...config,
          persist: {
            ...config.persist,
            format: [],
            filename: `${commit}-report`,
          },
        } satisfies CoreConfig;
        progress.updateTitle(`Collect ${commit}`);
        await collectAndPersistReports(
          commitConfig as unknown as CollectAndPersistReportsOptions,
        );
        result['duration'] = calcDuration(start);

        if (!(commitConfig as unknown as UploadOptions)?.upload) {
          console.warn('Upload skipped because configuration is not set.'); // @TODO log verbose
        } else {
          progress.updateTitle(`Upload ${commit}`);
          await upload(commitConfig as unknown as UploadOptions);
          result['upload'] = new Date().toISOString();
        }

        reports.push({
          [join(config.persist.filename)]: result,
        });
      }
      progress.endProgress('History generated!');

      await git.checkout(current);
      console.log('Current Branch:', current);
      console.log('Reports:', reports);
      await writeFile('history.json', JSON.stringify(reports, null, 2));
    },
  } satisfies CommandModule;
}
