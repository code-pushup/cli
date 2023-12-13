import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {CoreConfig, Report} from '@code-pushup/models';
import {calcDuration, getProgressBar, git, startDuration,} from '@code-pushup/utils';
import {collectAndPersistReports, CollectAndPersistReportsOptions,} from './collect-and-persist';
import {GlobalOptions} from './types';
import {upload, UploadOptions} from './upload';

export type HistoryOptions = {
  targetBranch: string;
} & Pick<CoreConfig, 'persist' | 'plugins' | 'categories'> &
  GlobalOptions;

export async function history(config: Omit<HistoryOptions, 'targetBranch'>, commits: string[]): Promise<Record<string, unknown>[]> {
  const reports: Record<string, unknown>[] = [];

  const progress = getProgressBar('History');
  // eslint-disable-next-line functional/no-loop-statements
  for (const commit of commits) {
    const start = startDuration();
    const result: Record<string, unknown> = {
      commit,
      start,
    };
    progress.incrementInSteps(commits.length);

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

  return reports;
}
