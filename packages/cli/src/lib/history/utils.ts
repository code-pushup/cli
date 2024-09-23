import type { HistoryOptions } from '@code-pushup/core';
import { getHashFromTag, isSemver } from '@code-pushup/utils';
import type { HistoryCliOptions } from './history.model';

export async function normalizeHashOptions(
  processArgs: HistoryCliOptions & HistoryOptions,
): Promise<HistoryCliOptions & HistoryOptions> {
  const {
    onlySemverTags,
    // overwritten
    maxCount,
    ...opt
  } = processArgs;

  // eslint-disable-next-line functional/no-let, prefer-const
  let { from, to, ...processOptions } = opt;
  // if no semver filter is used resolve hash of tags, as hashes are used to collect history
  if (!onlySemverTags) {
    if (from && isSemver(from)) {
      const { hash } = await getHashFromTag(from);
      from = hash;
    }
    if (to && isSemver(to)) {
      const { hash } = await getHashFromTag(to);
      to = hash;
    }
  }

  return {
    ...processOptions,
    onlySemverTags,
    maxCount: maxCount && maxCount > 0 ? maxCount : undefined,
    from,
    to,
  };
}
