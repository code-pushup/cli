import { LogOptions, LogResult, simpleGit } from 'simple-git';
import { CoreConfig, PersistConfig, UploadConfig } from '@code-pushup/models';
import { getCurrentBranchOrTag, safeCheckout, ui } from '@code-pushup/utils';
import { collectAndPersistReports } from './collect-and-persist';
import { GlobalOptions } from './types';
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

/**
 * `getHashes` returns a list of commit hashes. Internally it uses `git.log()` to determine the commits within a range.
 * The amount can be limited to a maximum number of commits specified by `maxCount`.
 * With `from` and `to`, you can specify a range of commits.
 *
 * **NOTE:**
 * In Git, specifying a range with two dots (`from..to`) selects commits that are reachable from `to` but not from `from`.
 * Essentially, it shows the commits that are in `to` but not in `from`, excluding the commits unique to `from`.
 *
 * Example:
 *
 * Let's consider the following commit history:
 *
 *   A---B---C---D---E (main)
 *
 * Using `git log B..D`, you would get the commits C and D:
 *
 *   C---D
 *
 * This is because these commits are reachable from D but not from B.
 *
 * ASCII Representation:
 *
 *   Main Branch:    A---B---C---D---E
 *                       \       \
 *                        \       +--- Commits included in `git log B..D`
 *                         \
 *                          +--- Excluded by the `from` parameter
 *
 * With `simple-git`, when you specify a `from` and `to` range like this:
 *
 *   git.log({ from: 'B', to: 'D' });
 *
 * It interprets it similarly, selecting commits between B and D, inclusive of D but exclusive of B.
 * For `git.log({ from: 'B', to: 'D' })` or `git log B..D`, commits C and D are selected.
 *
 * @param options Object containing `from`, `to`, and optionally `maxCount` to specify the commit range and limit.
 * @param git The `simple-git` instance used to execute Git commands.
 */
export async function getHashes(
  options: LogOptions,
  git = simpleGit(),
): Promise<string[]> {
  const { from, to } = options;

  if (to && !from) {
    // throw more user-friendly error instead of:
    // fatal: ambiguous argument '...a': unknown revision or path not in the working tree.
    // Use '--' to separate paths from revisions, like this:
    // 'git <command> [<revision>...] -- [<file>...]'
    throw new Error(
      `git log command needs the "from" option defined to accept the "to" option.\n`,
    );
  }

  const logs = await git.log({
    ...options,
    from,
    to,
  });

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
