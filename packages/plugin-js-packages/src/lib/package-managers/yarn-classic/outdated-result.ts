import { fromJsonLines } from '@code-pushup/utils';
import { OutdatedResult } from '../../runner/outdated/types';
import { Yarnv1OutdatedResultJson } from './types';

export function yarnv1ToOutdatedResult(output: string): OutdatedResult {
  const yarnv1Outdated = fromJsonLines<Yarnv1OutdatedResultJson>(output);
  const dependencies = yarnv1Outdated[1].data.body;

  return dependencies.map(([name, current, _, latest, __, type, url]) => ({
    name,
    current,
    latest,
    type,
    url,
  }));
}
