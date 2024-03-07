import { LogResult } from 'simple-git';
import { CoreConfig, PersistConfig, UploadConfig } from '@code-pushup/models';
import { getCurrentBranchOrTag, safeCheckout } from '@code-pushup/utils';
import { collectAndPersistReports } from './collect-and-persist';
import { GlobalOptions } from './types';
import { upload } from './upload';

export type HistoryOnlyOptions = {
  targetBranch?: string;
  skipUploads?: boolean;
  forceCleanStatus?: boolean;
};
export type HistoryOptions = Required<Pick<CoreConfig, 'plugins' | 'categories'>> & {
    persist: Required<PersistConfig>;
    upload?: Required<UploadConfig>;
  } & HistoryOnlyOptions &
  GlobalOptions;

export async function history(
  config: HistoryOptions,
  commits: string[],
): Promise<string[]> {
  const initialBranch: string = await getCurrentBranchOrTag();

  const { skipUploads = false, forceCleanStatus, persist } = config;

  const reports: string[] = [];
  // eslint-disable-next-line functional/no-loop-statements
  for (const commit of commits) {
    console.info(`Collect ${commit}`);
    await safeCheckout(commit, forceCleanStatus);

    const currentConfig: HistoryOptions = {
      ...config,
      persist: {
        ...persist,
        format: ['json'],
        filename: `${commit}-report`,
      },
    };

    await collectAndPersistReports(currentConfig);

    if (skipUploads) {
      console.warn('Upload is skipped because skipUploads is set to true.');
    } else {
      if (currentConfig.upload) {
        await upload(currentConfig);
      } else {
        console.warn('Upload is skipped because upload config is undefined.');
      }
    }

    // eslint-disable-next-line functional/immutable-data
    reports.push(currentConfig.persist.filename);
  }

  await safeCheckout(initialBranch, forceCleanStatus);

  return reports;
}

export function prepareHashes(logs: LogResult): string[] {
  return (
    logs.all
      .map(({ hash }) => hash)
      // sort from oldest to newest
      .reverse()
  );
}
