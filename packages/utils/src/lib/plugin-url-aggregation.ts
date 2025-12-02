import type {
  Audit,
  CategoryRef,
  Group,
  PluginConfig,
} from '@code-pushup/models';
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

export function resolveUrlWeight(
  weights: PluginUrlContext['weights'],
  index: number,
  userDefinedWeight?: number,
): number {
  return weights[index + 1] ?? userDefinedWeight ?? 1;
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

export function createCategoryRefs(
  groupSlug: string,
  pluginSlug: string,
  context: PluginUrlContext,
): CategoryRef[] {
  return Array.from({ length: context.urlCount }, (_, i) => ({
    plugin: pluginSlug,
    slug: shouldExpandForUrls(context.urlCount)
      ? addIndex(groupSlug, i)
      : groupSlug,
    type: 'group',
    weight: resolveUrlWeight(context.weights, i),
  }));
}

export function expandCategoryRefs(
  ref: CategoryRef,
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

export class ContextValidationError extends Error {
  constructor(message: string) {
    super(`Invalid plugin context: ${message}`);
  }
}

export function validateUrlContext(
  context: PluginConfig['context'],
): asserts context is PluginUrlContext {
  if (!context || typeof context !== 'object') {
    throw new ContextValidationError('must be an object');
  }
  const { urlCount, weights } = context;
  if (typeof urlCount !== 'number' || urlCount < 0) {
    throw new ContextValidationError('urlCount must be a non-negative number');
  }
  if (!weights || typeof weights !== 'object') {
    throw new ContextValidationError('weights must be an object');
  }
  if (Object.keys(weights).length !== urlCount) {
    throw new ContextValidationError('weights count must match urlCount');
  }
}
