import { LogResult, simpleGit } from 'simple-git';
import {
  CoreConfig,
  Format,
  PersistConfig,
  UploadConfig,
  uploadConfigSchema,
} from '@code-pushup/models';
import { getCurrentBranchOrTag, safeCheckout } from '@code-pushup/utils';
import { collectAndPersistReports } from './collect-and-persist';
import { GlobalOptions } from './types';
import { upload as uploadCommandLogic } from './upload';

export type HistoryOnlyOptions = {
  targetBranch?: string;
  uploadReports?: boolean;
  forceCleanStatus?: boolean;
};
export type HistoryOptions = Required<
  Pick<CoreConfig, 'plugins' | 'categories'> & {
    persist: Required<PersistConfig>;
    upload: Required<UploadConfig>;
  }
> &
  GlobalOptions &
  HistoryOnlyOptions;

export async function history(
  config: HistoryOptions,
  commits: string[],
): Promise<string[]> {
  const initialBranch: string = await getCurrentBranchOrTag();

  const { uploadReports = true } = config;
  if (!uploadReports) {
    console.warn('Upload is skipped because uploadReports is set to false');
  }

  const reports: string[] = [];
  // eslint-disable-next-line functional/no-loop-statements
  for (const commit of commits) {
    console.info(`Collect ${commit}`);
    await safeCheckout(commit, { forceCleanStatus: config.forceCleanStatus });

    const currentConfig: HistoryOptions = {
      ...config,
      persist: {
        ...config.persist,
        format: ['json'],
        filename: `${commit}-report`,
      },
    };

    await collectAndPersistReports(currentConfig);

    if (uploadReports) {
      const result = uploadConfigSchema.safeParse(currentConfig.upload);
      if (result.success) {
        await uploadCommandLogic({ ...currentConfig, upload: result.data });
      } else {
        console.error(`Collecting ${commit} failed.`);
        console.error(result.error);
      }
    }

    // eslint-disable-next-line functional/immutable-data
    reports.push(currentConfig.persist.filename);
  }

  await safeCheckout(initialBranch, {
    forceCleanStatus: config.forceCleanStatus,
  });

  return reports;
}

export async function getHashes(
  options: {
    from?: string;
    to?: string;
    maxCount?: number;
  } = {},
  git = simpleGit(),
): Promise<string[]> {
  const { from, to, maxCount } = options;

  if (from || to) {
    // validate from & to
    if (from === undefined || from === '') {
      throw new Error('from has to be defined');
    }
    if (to === undefined || to === '') {
      throw new Error('to has to be defined');
    }

    const logsFromTo = await git.log({ from, to, maxCount });
    return prepareHashes(logsFromTo);
  }

  const logs = await git.log(maxCount ? { maxCount } : {});
  return prepareHashes(logs);
}

export function prepareHashes(logs: LogResult): string[] {
  return (
    logs.all
      .map(({ hash }) => hash)
      // sort from oldest to newest
      .reverse()
  );
}
