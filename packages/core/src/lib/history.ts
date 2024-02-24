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
  forceCleanStatus?: true;
};
export type HistoryOptions = Required<
  Pick<CoreConfig, 'plugins' | 'categories'> & {
    persist: Required<PersistConfig>;
  } & { upload: Required<UploadConfig> }
> &
  GlobalOptions &
  HistoryOnlyOptions;

export async function history(
  config: HistoryOptions,
  commits: string[],
): Promise<string[]> {
  const reports: string[] = [];

  const initialBranch: string = await getCurrentBranchOrTag();

  // eslint-disable-next-line functional/no-loop-statements
  for (const commit of commits) {
    await safeCheckout(commit, { forceCleanStatus: config.forceCleanStatus });
    console.info(`Collect ${commit}`);

    const currentConfig: HistoryOptions = {
      ...config,
      persist: {
        ...config.persist,
        format: ['json' as Format],
        filename: `${commit}-report`,
      },
    };

    await collectAndPersistReports(currentConfig);

    const { uploadReports = true } = currentConfig as unknown as HistoryOptions;
    if (uploadReports) {
      const result = uploadConfigSchema.safeParse(currentConfig.upload);
      if (result.success) {
        await uploadCommandLogic({ ...currentConfig, upload: result.data });
      } else {
        console.error(result.error);
      }
    } else {
      console.warn('Upload skipped because uploadReports is set to false');
    }

    // eslint-disable-next-line functional/immutable-data
    reports.push(currentConfig.persist.filename);
  }

  await safeCheckout(initialBranch, {
    forceCleanStatus: config.forceCleanStatus,
  });
  // eslint-disable-next-line no-console
  console.log('Current Branch:', initialBranch);

  return reports;
}
