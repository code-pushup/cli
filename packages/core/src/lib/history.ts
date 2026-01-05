import type {
  CacheConfigObject,
  CoreConfig,
  PersistConfig,
  UploadConfig,
} from '@code-pushup/models';
import {
  type WithRequired,
  getCurrentBranchOrTag,
  logger,
  safeCheckout,
} from '@code-pushup/utils';
import { collectAndPersistReports } from './collect-and-persist.js';
import { upload } from './upload.js';

export type HistoryOnlyOptions = {
  targetBranch?: string;
  skipUploads?: boolean;
  forceCleanStatus?: boolean;
};
export type HistoryOptions = Pick<CoreConfig, 'plugins' | 'categories'> & {
  persist: Required<PersistConfig>;
  cache: CacheConfigObject;
  upload?: Required<UploadConfig>;
} & HistoryOnlyOptions;

export async function history(
  config: HistoryOptions,
  commits: string[],
): Promise<string[]> {
  const initialBranch: string = await getCurrentBranchOrTag();

  const { skipUploads = false, forceCleanStatus, persist } = config;

  const reports: string[] = [];
  // eslint-disable-next-line functional/no-loop-statements
  for (const commit of commits) {
    logger.info(`Collecting for commit ${commit}`);
    await safeCheckout(commit, forceCleanStatus);

    const currentConfig: HistoryOptions = {
      ...config,
      persist: {
        ...persist,
        format: ['json'],
        filename: `${commit}-report`,
      },
      cache: {
        read: false,
        write: false,
      },
    };

    await collectAndPersistReports(currentConfig);

    if (skipUploads) {
      logger.info('Upload is skipped because skipUploads is set to true.');
    } else {
      if (hasUpload(currentConfig)) {
        await upload(currentConfig);
      } else {
        logger.info('Upload is skipped because upload config is undefined.');
      }
    }

    // eslint-disable-next-line functional/immutable-data
    reports.push(currentConfig.persist.filename);
  }

  await safeCheckout(initialBranch, forceCleanStatus);

  return reports;
}

function hasUpload(
  config: HistoryOptions,
): config is WithRequired<HistoryOptions, 'upload'> {
  return config.upload != null;
}
