import type { Audit, CategoryRef, Group } from '@code-pushup/models';
import {
  type PluginUrlContext,
  SINGLE_URL_THRESHOLD,
  getUrlIdentifier,
} from './plugin-url-config.js';

export function shouldExpandForUrls(urlCount: number): boolean {
  return urlCount > SINGLE_URL_THRESHOLD;
}

export function addIndex(slug: string, index: number): string {
  return `${slug}-${index + 1}`;
}

export function removeIndex(slug: string): string {
  return slug.replace(/-\d+$/, '');
}

export function extractGroupSlugs(groups: Group[]): string[] {
  const slugs = groups.map(({ slug }) => removeIndex(slug));
  return [...new Set(slugs)];
}

export function resolveUrlWeight(
  weights: PluginUrlContext['weights'],
  index: number,
  userDefinedWeight?: number,
): number {
  const urlWeight = weights[index + 1] ?? 1;
  if (userDefinedWeight == null) {
    return urlWeight;
  }
  return (urlWeight + userDefinedWeight) / 2;
}

export function expandAuditsForUrls(audits: Audit[], urls: string[]): Audit[] {
  return urls.flatMap((url, index) =>
    audits.map(audit => ({
      ...audit,
      slug: addIndex(audit.slug, index),
      title: `${audit.title} (${getUrlIdentifier(url)})`,
    })),
  );
}

export function expandGroupsForUrls(groups: Group[], urls: string[]): Group[] {
  return urls.flatMap((url, index) =>
    groups.map(group => ({
      ...group,
      slug: addIndex(group.slug, index),
      title: `${group.title} (${getUrlIdentifier(url)})`,
      refs: group.refs.map(ref => ({
        ...ref,
        slug: addIndex(ref.slug, index),
      })),
    })),
  );
}

type CategoryRefInput = Omit<CategoryRef, 'weight'> & { weight?: number };

export function expandCategoryRefs(
  ref: CategoryRefInput,
  context: PluginUrlContext,
): CategoryRef[] {
  return Array.from({ length: context.urlCount }, (_, i) => ({
    ...ref,
    slug: shouldExpandForUrls(context.urlCount)
      ? addIndex(ref.slug, i)
      : ref.slug,
    weight: resolveUrlWeight(context.weights, i, ref.weight),
  }));
}
