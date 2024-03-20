import { objectToEntries } from '@code-pushup/utils';
import {
  NormalizedVersionOverview,
  NpmOutdatedResultJson,
  OutdatedResult,
  Yarnv1OutdatedResultJson,
} from './types';

export function npmToOutdatedResult(output: string): OutdatedResult {
  const npmOutdated = JSON.parse(output) as NpmOutdatedResultJson;
  return objectToEntries(npmOutdated)
    .filter(
      (entry): entry is [string, NormalizedVersionOverview] =>
        entry[1].current != null,
    )
    .map(([name, overview]) => ({
      name,
      current: overview.current,
      wanted: overview.wanted,
      type: overview.type,
      project: overview.dependent,
      ...(overview.homepage != null && { url: overview.homepage }),
    }));
}

export function yarnv1ToOutdatedResult(output: string): OutdatedResult {
  const yarnv1Outdated = JSON.parse(output) as Yarnv1OutdatedResultJson;
  const dependencies = yarnv1Outdated.data.body;
  return dependencies.map(([name, current, wanted, _, project, type, url]) => ({
    name,
    current,
    wanted,
    project,
    type,
    url,
  }));
}
