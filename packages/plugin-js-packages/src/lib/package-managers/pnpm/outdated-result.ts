import { objectToEntries } from '@code-pushup/utils';
import type { OutdatedResult } from '../../runner/outdated/types.js';
import type { PnpmOutdatedResultJson } from './types.js';
import { filterOutWarnings } from './utils.js';

export function pnpmToOutdatedResult(output: string): OutdatedResult {
  const pnpmOutdated = JSON.parse(
    filterOutWarnings(output),
  ) as PnpmOutdatedResultJson;

  // "current" may be missing if package is not installed
  // Fallback to "wanted" - same approach as npm
  return objectToEntries(pnpmOutdated).map(
    ([name, { current, latest, wanted, dependencyType: type }]) => ({
      name,
      current: current || wanted,
      latest,
      type,
    }),
  );
}
