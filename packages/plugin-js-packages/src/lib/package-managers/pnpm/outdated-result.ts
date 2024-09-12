import { objectToEntries } from '@code-pushup/utils';
import type { OutdatedResult } from '../../runner/outdated/types';
import type { PnpmOutdatedResultJson } from './types';
import { filterWarnings } from './utils';

export function pnpmToOutdatedResult(output: string): OutdatedResult {
  const pnpmOutdated = JSON.parse(
    filterWarnings(output),
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
