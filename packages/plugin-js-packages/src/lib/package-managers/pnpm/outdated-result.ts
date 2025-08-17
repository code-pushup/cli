import { objectToEntries } from '@code-pushup/utils';
import type { OutdatedResult } from '../../runner/outdated/types.js';
import type { PnpmOutdatedResultJson } from './types.js';
import { filterOutWarnings } from './utils.js';

export function pnpmToOutdatedResult(output: string): OutdatedResult {
  const pnpmOutdated = JSON.parse(
    filterOutWarnings(output),
  ) as PnpmOutdatedResultJson;

  return objectToEntries(pnpmOutdated).map(
    ([name, { current, latest, dependencyType: type }]) => ({
      name,
      current,
      latest,
      type,
    }),
  );
}
