import {
  addIndex,
  expandAuditsForUrls,
  expandGroupsForUrls,
  shouldExpandForUrls,
} from '@code-pushup/utils';
import {
  LIGHTHOUSE_GROUPS,
  LIGHTHOUSE_NAVIGATION_AUDITS,
} from './runner/constants.js';
import { type FilterOptions, markSkippedAuditsAndGroups } from './utils.js';

export function expandOptionsForUrls(
  options: FilterOptions,
  urlCount: number,
): FilterOptions {
  return Object.fromEntries(
    Object.entries(options).map(([key, value]) => [
      key,
      Array.isArray(value)
        ? value.flatMap(slug =>
            Array.from({ length: urlCount }, (_, i) => addIndex(slug, i)),
          )
        : value,
    ]),
  );
}

export function processAuditsAndGroups(urls: string[], options: FilterOptions) {
  if (!shouldExpandForUrls(urls.length)) {
    return markSkippedAuditsAndGroups(
      LIGHTHOUSE_NAVIGATION_AUDITS,
      LIGHTHOUSE_GROUPS,
      options,
    );
  }
  const expandedAudits = expandAuditsForUrls(
    LIGHTHOUSE_NAVIGATION_AUDITS,
    urls,
  );
  const expandedGroups = expandGroupsForUrls(LIGHTHOUSE_GROUPS, urls);
  const expandedOptions = expandOptionsForUrls(options, urls.length);
  return markSkippedAuditsAndGroups(
    expandedAudits,
    expandedGroups,
    expandedOptions,
  );
}
