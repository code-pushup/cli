import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CoreConfig } from '@code-pushup/models';
import {
  calcDuration,
  getCurrentBranchOrTag,
  getProgressBar,
  git,
  guardAgainstDirtyRepo,
  startDuration,
} from '@code-pushup/utils';
import {
  CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from './collect-and-persist';
import { GlobalOptions } from './types';
import { UploadOptions, upload } from './upload';

export type HistoryOptions = {
  targetBranch: string;
} & Pick<CoreConfig, 'persist' | 'plugins' | 'categories'> &
  GlobalOptions;

export async function history(options: HistoryOptions): Promise<void> {
  const { targetBranch, ...config } = options;

  const initialBranch: string = await getCurrentBranchOrTag();
  // eslint-disable-next-line no-console
  console.log('Initial Branch:', initialBranch);

  await guardAgainstDirtyRepo();

  git.checkout(targetBranch);

  const current: string = await getCurrentBranchOrTag();
  // eslint-disable-next-line no-console
  console.log('Current Branch:', current);

  const log = await git.log();

  const commitsToAudit = log.all
    .map(({ hash }) => hash)
    // crawl from oldest to newest
    .reverse();

  const reports: unknown[] = [];
// eslint-disable-next-line no-console
  console.log('All Log:', commitsToAudit.length);

  git.checkout(initialBranch);
  return;
  const progress = getProgressBar('History');
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
  // eslint-disable-next-line no-console
  console.log('Current Branch:', current);
  // eslint-disable-next-line no-console
  console.log('Reports:', reports);
  await writeFile('history.json', JSON.stringify(reports, null, 2));
}
