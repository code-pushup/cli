import { join } from 'node:path';
import { CoreConfig } from '@code-pushup/models';
import { getProgressBar, getStartDuration, git } from '@code-pushup/utils';
import {
  CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from './collect-and-persist';
import { GlobalOptions } from './types';
import { UploadOptions, upload as uploadCommandLogic } from './upload';

export type HistoryOnlyOptions = {
  targetBranch: string;
  numSteps: number;
  uploadReports: boolean;
};
export type HistoryOptions = Required<CoreConfig> &
  GlobalOptions &
  HistoryOnlyOptions;

export async function history(
  config: HistoryOptions,
  commits: string[],
): Promise<Record<string, unknown>[]> {
  const reports: Record<string, unknown>[] = [];
  const progressBar = config?.progress ? getProgressBar('history') : null;
  // eslint-disable-next-line functional/no-loop-statements
  for (const commit of commits) {

    const start: number = getStartDuration();
    const result: Record<string, unknown> = {
      commit,
      start,
    };
    progressBar?.incrementInSteps(commits.length);

    await git.checkout(commit);

    progressBar?.updateTitle(`Collect ${commit}`);

    const currentConfig = {
      ...config,
      persist: {
        ...config.persist,
        format: ['json'],
        filename: `${commit}-report`,
      },
    } satisfies CollectAndPersistReportsOptions;
    await collectAndPersistReports(currentConfig);

    const { uploadReports, progress } =
      currentConfig as unknown as HistoryOptions;
    if (uploadReports) {
      progressBar?.updateTitle(`Upload ${commit}`);
      if (!progress) {
        console.warn(`Upload ${commit}`); // @TODO log verbose
      }
      await uploadCommandLogic(currentConfig as unknown as UploadOptions);
      // eslint-disable-next-line functional/immutable-data
      result['uploadDate'] = new Date().toISOString();
    } else {
      console.warn('Upload skipped because configuration is not set.'); // @TODO log verbose
    }

    // eslint-disable-next-line functional/immutable-data
    reports.push({
      [join(currentConfig.persist.filename)]: result,
    });
  }

  return reports;
}
