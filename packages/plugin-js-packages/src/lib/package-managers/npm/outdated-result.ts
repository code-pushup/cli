import { objectToEntries } from '@code-pushup/utils';
import type { OutdatedResult } from '../../runner/outdated/types.js';
import type { NpmNormalizedOverview, NpmOutdatedResultJson } from './types.js';

export function npmToOutdatedResult(output: string): OutdatedResult {
  const npmOutdated = JSON.parse(output) as NpmOutdatedResultJson;
  // current might be missing in some cases
  // https://stackoverflow.com/questions/42267101/npm-outdated-command-shows-missing-in-current-version
  return objectToEntries(npmOutdated)
    .filter(
      (entry): entry is [string, NpmNormalizedOverview] =>
        entry[1].current != null,
    )
    .map(([name, overview]) => ({
      name,
      current: overview.current,
      latest: overview.latest,
      type: overview.type,
      ...(overview.homepage != null && { url: overview.homepage }),
    }));
}
