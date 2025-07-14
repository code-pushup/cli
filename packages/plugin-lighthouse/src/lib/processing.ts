import type { Audit, Group } from '@code-pushup/models';
import { SINGLE_URL_THRESHOLD } from './constants.js';
import {
  LIGHTHOUSE_GROUPS,
  LIGHTHOUSE_NAVIGATION_AUDITS,
} from './runner/constants.js';
import type { LighthouseContext, LighthouseUrls } from './types.js';
import { type FilterOptions, markSkippedAuditsAndGroups } from './utils.js';

export function orderSlug(slug: string, index: number): string {
  return `${slug}-${index + 1}`;
}

export function shouldExpandForUrls(urlCount: number): boolean {
  return urlCount > SINGLE_URL_THRESHOLD;
}

export function normalizeUrlInput(input: LighthouseUrls): {
  urls: string[];
  context: LighthouseContext;
} {
  const urls = extractUrls(input);
  const weights = Object.fromEntries(
    urls.map((url, index) => [index + 1, getWeightForUrl(input, url)]),
  );
  return {
    urls,
    context: {
      urlCount: urls.length,
      weights,
    },
  };
}

export function extractUrls(input: LighthouseUrls): string[] {
  if (Array.isArray(input)) {
    return input;
  }
  if (typeof input === 'string') {
    return [input];
  }
  return Object.keys(input);
}

export function getWeightForUrl(input: LighthouseUrls, url: string): number {
  if (typeof input === 'object' && !Array.isArray(input)) {
    return input[url] ?? 1;
  }
  return 1;
}

export function getUrlIdentifier(url: string): string {
  try {
    const { host, pathname } = new URL(url);
    const path = pathname === '/' ? '' : pathname;
    return `${host}${path}`;
  } catch {
    return url;
  }
}

export function expandAuditsForUrls(audits: Audit[], urls: string[]): Audit[] {
  return urls.flatMap((url, index) =>
    audits.map(audit => ({
      ...audit,
      slug: orderSlug(audit.slug, index),
      title: `${audit.title} (${getUrlIdentifier(url)})`,
    })),
  );
}

export function expandGroupsForUrls(groups: Group[], urls: string[]): Group[] {
  return urls.flatMap((url, index) =>
    groups.map(group => ({
      ...group,
      slug: orderSlug(group.slug, index),
      title: `${group.title} (${getUrlIdentifier(url)})`,
      refs: group.refs.map(ref => ({
        ...ref,
        slug: orderSlug(ref.slug, index),
      })),
    })),
  );
}

export function expandOptionsForUrls(
  options: FilterOptions,
  urlCount: number,
): FilterOptions {
  return Object.fromEntries(
    Object.entries(options).map(([key, value]) => [
      key,
      Array.isArray(value)
        ? value.flatMap(slug =>
            Array.from({ length: urlCount }, (_, i) => orderSlug(slug, i)),
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
