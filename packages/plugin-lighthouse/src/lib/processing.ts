import type { Audit, Group } from '@code-pushup/models';
import {
  addIndex,
  expandAuditsForUrls,
  expandGroupsForUrls,
  logger,
  objectFromEntries,
  objectToEntries,
  pluralizeToken,
  shouldExpandForUrls,
} from '@code-pushup/utils';
import { formatMetaLog } from './format.js';
import {
  LIGHTHOUSE_GROUPS,
  LIGHTHOUSE_NAVIGATION_AUDITS,
} from './runner/constants.js';
import { type FilterOptions, markSkippedAuditsAndGroups } from './utils.js';

export function expandOptionsForUrls(
  options: FilterOptions,
  urlCount: number,
): FilterOptions {
  return objectFromEntries(
    objectToEntries(options).map(([key, value = []]) => [
      key,
      value.flatMap(slug =>
        Array.from({ length: urlCount }, (_, i) => addIndex(slug, i)),
      ),
    ]),
  );
}

export function processAuditsAndGroups(urls: string[], options: FilterOptions) {
  logTotal();
  if (!shouldExpandForUrls(urls.length)) {
    const marked = markSkippedAuditsAndGroups(
      LIGHTHOUSE_NAVIGATION_AUDITS,
      LIGHTHOUSE_GROUPS,
      options,
    );
    logSkipped(marked);
    return marked;
  }
  const expandedAudits = expandAuditsForUrls(
    LIGHTHOUSE_NAVIGATION_AUDITS,
    urls,
  );
  const expandedGroups = expandGroupsForUrls(LIGHTHOUSE_GROUPS, urls);
  const expandedOptions = expandOptionsForUrls(options, urls.length);
  logExpanded(expandedAudits, expandedGroups, urls);
  const marked = markSkippedAuditsAndGroups(
    expandedAudits,
    expandedGroups,
    expandedOptions,
  );
  logSkipped(marked);
  return marked;
}

function logTotal(): void {
  logger.info(
    formatMetaLog(
      `Created ${pluralizeToken('group', LIGHTHOUSE_GROUPS.length)} and ${pluralizeToken('audit', LIGHTHOUSE_NAVIGATION_AUDITS.length)} from Lighthouse's categories and navigation audits`,
    ),
  );
}

function logExpanded(
  expandedAudits: Audit[],
  expandedGroups: Group[],
  urls: string[],
): void {
  logger.info(
    formatMetaLog(
      `Expanded audits (${LIGHTHOUSE_NAVIGATION_AUDITS.length} → ${expandedAudits.length}) and groups (${LIGHTHOUSE_GROUPS.length} → ${expandedGroups.length}) for ${pluralizeToken('URL', urls.length)}`,
    ),
  );
}

function logSkipped(marked: { audits: Audit[]; groups: Group[] }): void {
  const { audits, groups } = marked;

  const formattedCounts = [
    { name: 'audit', items: audits },
    { name: 'group', items: groups },
  ]
    .map(({ name, items }) => {
      const skipped = items.filter(({ isSkipped }) => isSkipped);
      if (skipped.length === 0) {
        return '';
      }
      return `${skipped.length} out of ${pluralizeToken(name, items.length)}`;
    })
    .filter(Boolean)
    .join(' and ');

  if (!formattedCounts) {
    return;
  }
  logger.info(formatMetaLog(`Skipping ${formattedCounts}`));
}
