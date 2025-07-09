import type { OutdatedResult } from '../../runner/outdated/types.js';
import type { YarnBerryOutdatedResultJson } from './types.js';

export function yarnBerryToOutdatedResult(output: string): OutdatedResult {
  const npmOutdated = JSON.parse(output) as YarnBerryOutdatedResultJson;

  return npmOutdated.map(({ name, current, latest, type }) => ({
    name,
    current,
    latest,
    type,
  }));
}
