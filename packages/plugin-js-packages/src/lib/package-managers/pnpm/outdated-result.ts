import { objectToEntries } from '@code-pushup/utils';
import { OutdatedResult } from '../../runner/outdated/types';
import { PnpmOutdatedResultJson } from './types';

export function pnpmToOutdatedResult(output: string): OutdatedResult {
  const pnpmOutdated = JSON.parse(output) as PnpmOutdatedResultJson;

  return objectToEntries(pnpmOutdated).map(
    ([name, { current, latest, dependencyType: type }]) => ({
      name,
      current,
      latest,
      type,
    }),
  );
}
