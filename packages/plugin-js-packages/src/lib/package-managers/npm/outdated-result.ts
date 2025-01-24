import { objectToEntries } from '@code-pushup/utils';
import type { OutdatedResult } from '../../runner/outdated/types.js';
import type { NpmOutdatedResultJson } from './types.js';

export function npmToOutdatedResult(output: string): OutdatedResult {
  const npmOutdated = JSON.parse(output) as NpmOutdatedResultJson;
  // "current" might be missing in some cases, usually it is missing if the dependency is not installed, fallback to "wanted" should avoid this problem
  // https://stackoverflow.com/questions/42267101/npm-outdated-command-shows-missing-in-current-version
  return objectToEntries(npmOutdated).map(([name, overview]) => ({
    name,
    current: overview.current || overview.wanted,
    latest: overview.latest,
    type: overview.type,
    ...(overview.homepage != null && { url: overview.homepage }),
  }));
}
