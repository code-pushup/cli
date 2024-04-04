import { fromJsonLines, objectToEntries } from '@code-pushup/utils';
import {
  NpmNormalizedOverview,
  NpmOutdatedResultJson,
  OutdatedResult,
  PnpmOutdatedResultJson,
  Yarnv1OutdatedResultJson,
  Yarnv2OutdatedResultJson,
} from './types';

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

export function yarnv2ToOutdatedResult(output: string): OutdatedResult {
  const npmOutdated = JSON.parse(output) as Yarnv2OutdatedResultJson;

  return npmOutdated.map(({ name, current, latest, type }) => ({
    name,
    current,
    latest,
    type,
  }));
}

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
