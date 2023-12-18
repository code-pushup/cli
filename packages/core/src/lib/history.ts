import { join } from 'node:path';
import { CoreConfig } from '@code-pushup/models';
import { getProgressBar, getStartDuration, git } from '@code-pushup/utils';
import { collectAndPersistReports } from './collect-and-persist';
import { GlobalOptions } from './types';
import {upload as uploadCommandLogic} from "./upload";
import { UploadOptions } from './upload';

export type HistoryOptions = Required<CoreConfig> & GlobalOptions;

export async function history(
  config: HistoryOptions,
  commits: string[],
): Promise<Record<string, unknown>[]> {
  const reports: Record<string, unknown>[] = [];
  const progressBar = config?.progress ? getProgressBar('history') : null;
  // eslint-disable-next-line functional/no-loop-statements
  for (const commit of commits) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
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
      upload: {},
      persist: {
        ...config.persist,
        format: [],
        filename: `${commit}-report`,
      },
    };
    await collectAndPersistReports(currentConfig);

    const { upload } = currentConfig as unknown as UploadOptions;
    if (upload) {
      console.warn('Upload skipped because configuration is not set.'); // @TODO log verbose
    } else {
      progressBar?.updateTitle(`Upload ${commit}`);
      await uploadCommandLogic(currentConfig as unknown as UploadOptions);
      result['uploadDate'] = new Date().toISOString();
    }
    /**/
    reports.push({
      [join(currentConfig.persist.filename)]: result,
    });
  }

  return reports;
}
