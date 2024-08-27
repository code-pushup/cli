import type {
  CoreConfig,
  PersistConfig,
  UploadConfig,
} from '@code-pushup/models';
import { getCurrentBranchOrTag, safeCheckout, ui } from '@code-pushup/utils';
import { collectAndPersistReports } from './collect-and-persist';
import type { GlobalOptions } from './types';
import { upload } from './upload';

export type HistoryOnlyOptions = {
  targetBranch?: string;
  skipUploads?: boolean;
  forceCleanStatus?: boolean;
};
export type HistoryOptions = Required<
  Pick<CoreConfig, 'plugins'> & Required<Pick<CoreConfig, 'categories'>>
> & {
  persist: Required<PersistConfig>;
  upload?: Required<UploadConfig>;
} & HistoryOnlyOptions &
  Partial<GlobalOptions>;

export async function history(
  config: HistoryOptions,
  commits: string[],
): Promise<string[]> {
  const initialBranch: string = await getCurrentBranchOrTag();

  const { skipUploads = false, forceCleanStatus, persist } = config;

  const reports: string[] = [];
  // eslint-disable-next-line functional/no-loop-statements
  for (const commit of commits) {
    ui().logger.info(`Collect ${commit}`);
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
      ui().logger.info('Upload is skipped because skipUploads is set to true.');
    } else {
      if (currentConfig.upload) {
        await upload(currentConfig);
      } else {
        ui().logger.info(
          'Upload is skipped because upload config is undefined.',
        );
      }
    }

    // eslint-disable-next-line functional/immutable-data
    reports.push(currentConfig.persist.filename);
  }

  await safeCheckout(initialBranch, forceCleanStatus);

  return reports;
}
