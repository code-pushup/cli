import type { Audit, CategoryRef, Group } from '@code-pushup/models';
import { toArray } from '@code-pushup/utils';
import { LIGHTHOUSE_PLUGIN_SLUG } from './constants.js';
import type { LighthouseCliFlags } from './runner/types.js';

export type LighthouseGroupSlugs =
  | 'performance'
  | 'accessibility'
  | 'best-practices'
  | 'seo'
  | 'pwa';

export function lighthouseGroupRef(
  groupSlug: LighthouseGroupSlugs,
  weight = 1,
): CategoryRef {
  return {
    plugin: LIGHTHOUSE_PLUGIN_SLUG,
    slug: groupSlug,
    type: 'group',
    weight,
  };
}

export function lighthouseAuditRef(auditSlug: string, weight = 1): CategoryRef {
  return {
    plugin: LIGHTHOUSE_PLUGIN_SLUG,
    slug: auditSlug,
    type: 'audit',
    weight,
  };
}

export class AuditsNotImplementedError extends Error {
  constructor(auditSlugs: string[]) {
    super(`audits: "${auditSlugs.join(', ')}" not implemented`);
  }
}

export function validateAudits(audits: Audit[], onlyAudits: string[]): boolean {
  const missingAudtis = toArray(onlyAudits).filter(
    slug => !audits.some(audit => audit.slug === slug),
  );
  if (missingAudtis.length > 0) {
    throw new AuditsNotImplementedError(missingAudtis);
  }
  return true;
}

export class CategoriesNotImplementedError extends Error {
  constructor(categorySlugs: string[]) {
    super(`categories: "${categorySlugs.join(', ')}" not implemented`);
  }
}

export function validateOnlyCategories(
  groups: Group[],
  onlyCategories: string | string[],
): boolean {
  const missingCategories = toArray(onlyCategories).filter(slug =>
    groups.every(group => group.slug !== slug),
  );
  if (missingCategories.length > 0) {
    throw new CategoriesNotImplementedError(missingCategories);
  }
  return true;
}

export type FilterOptions = Partial<
  Pick<LighthouseCliFlags, 'onlyAudits' | 'onlyCategories' | 'skipAudits'>
>;

// eslint-disable-next-line max-lines-per-function
export function markSkippedAuditsAndGroups(
  audits: Audit[],
  groups: Group[],
  options?: FilterOptions,
): {
  audits: Audit[];
  groups: Group[];
} {
  const {
    onlyAudits = [],
    skipAudits = [],
    onlyCategories = [],
  } = options ?? {};

  if (
    onlyCategories.length === 0 &&
    onlyAudits.length === 0 &&
    skipAudits.length === 0
  ) {
    return { audits, groups };
  }

  if (onlyCategories.length > 0) {
    validateOnlyCategories(groups, onlyCategories);
  }

  if (onlyAudits.length > 0 || skipAudits.length > 0) {
    validateAudits(audits, onlyAudits);
    validateAudits(audits, skipAudits);
  }

  const onlyGroupSlugs = new Set(onlyCategories);
  const onlyAuditSlugs = new Set(onlyAudits);
  const skipAuditSlugs = new Set(skipAudits);

  const markedGroups: Group[] = groups.map(group => ({
    ...group,
    isSkipped: onlyCategories.length > 0 && !onlyGroupSlugs.has(group.slug),
  }));

  const validGroupAuditSlugs = new Set(
    markedGroups
      .filter(group => !group.isSkipped)
      .flatMap(group => group.refs.map(ref => ref.slug)),
  );

  const markedAudits = audits.map(audit => ({
    ...audit,
    isSkipped:
      (onlyAudits.length > 0 && !onlyAuditSlugs.has(audit.slug)) ||
      (skipAudits.length > 0 && skipAuditSlugs.has(audit.slug)) ||
      (validGroupAuditSlugs.size > 0 && !validGroupAuditSlugs.has(audit.slug)),
  }));

  const fullyMarkedGroups = markedGroups.map(group => ({
    ...group,
    isSkipped:
      group.isSkipped ||
      group.refs.every(ref =>
        markedAudits.some(audit => audit.slug === ref.slug && audit.isSkipped),
      ),
  }));

  return {
    audits: markedAudits,
    groups: fullyMarkedGroups,
  };
}
