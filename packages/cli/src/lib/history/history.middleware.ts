import { HistoryOptions } from '@code-pushup/core';
import { getCurrentBranchOrTag } from '@code-pushup/utils';
import { CoreConfigCliOptions } from '../implementation/core-config.model';
import { GeneralCliOptions } from '../implementation/global.model';
import { OnlyPluginsOptions } from '../implementation/only-plugins.model';
import { normalizeHashOptions } from './history-command';
import { HistoryCliOptions } from './history.model';

export async function historyMiddleware<
  T extends GeneralCliOptions &
    CoreConfigCliOptions &
    OnlyPluginsOptions &
    HistoryCliOptions &
    HistoryOptions,
>(processArgs: T): Promise<T> {
  const currentBranch = await getCurrentBranchOrTag();
  let {
    semverTag,
    targetBranch = currentBranch,
    // overwritten
    from: rawFrom,
    to: rawTo,
    maxCount: rawMaxCount,
    ...processOptions
  } = processArgs;

  const filterOptions = (await normalizeHashOptions({
    targetBranch,
    from: rawFrom,
    to: rawTo,
    maxCount: rawMaxCount,
  })) as T;

  return {
    semverTag,
    targetBranch,
    ...filterOptions,
    ...processOptions,
  };
}
