import {join} from 'node:path';
import {CoreConfig} from '@code-pushup/models';
import {getProgressBar, git, getStartDuration} from '@code-pushup/utils';
import {collectAndPersistReports,} from './collect-and-persist';
import {GlobalOptions} from './types';
import {upload as uploadToServer, UploadOptions} from './upload';

export type HistoryOptions = {
  targetBranch: string;
} & Pick<CoreConfig, 'persist' | 'plugins' | 'categories'> &
  GlobalOptions;

export async function history(config: Omit<HistoryOptions, 'targetBranch'>, commits: string[]): Promise<Record<string, unknown>[]> {
  const reports: Record<string, unknown>[] = [];

  const progress = getProgressBar('History');
  // eslint-disable-next-line functional/no-loop-statements
  for (const commit of commits) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const start: number = getStartDuration();
    const result: Record<string, unknown> = {
      commit,
      start,
    };
    progress.incrementInSteps(commits.length);

    await git.checkout(commit);

    progress.updateTitle(`Collect ${commit}`);
    await collectAndPersistReports({
      ...config,
      persist: {
        ...config.persist,
        format: [],
        filename: `${commit}-report`,
      },
    });

    const {upload} = config;
    if (upload) {
      console.warn('Upload skipped because configuration is not set.'); // @TODO log verbose
    } else {
      progress.updateTitle(`Upload ${commit}`);
      await uploadToServer(config as unknown as UploadOptions);
      result['upload'] = new Date().toISOString();
    }

    reports.push({
      [join(config.persist.filename)]: result,
    });
  }

  return reports;
}
