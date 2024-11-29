import type { Audit, CategoryRef, Group } from '@code-pushup/models';
import { filterItemRefsBy, toArray } from '@code-pushup/utils';
import { LIGHTHOUSE_PLUGIN_SLUG } from './constants.js';
import type { LighthouseCliFlags } from './runner/index.js';

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

export function filterAuditsAndGroupsByOnlyOptions(
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

  // category wins over audits
  if (onlyCategories.length > 0) {
    validateOnlyCategories(groups, onlyCategories);

    const categorySlugs = new Set(onlyCategories);
    const filteredGroups: Group[] = groups.filter(({ slug }) =>
      categorySlugs.has(slug),
    );
    const auditSlugsFromRemainingGroups = new Set(
      filteredGroups.flatMap(({ refs }) => refs.map(({ slug }) => slug)),
    );
    return {
      audits: audits.filter(({ slug }) =>
        auditSlugsFromRemainingGroups.has(slug),
      ),
      groups: filteredGroups,
    };
  } else if (onlyAudits.length > 0 || skipAudits.length > 0) {
    validateAudits(audits, onlyAudits);
    validateAudits(audits, skipAudits);
    const onlyAuditSlugs = new Set(onlyAudits);
    const skipAuditSlugs = new Set(skipAudits);
    const filterAudits = ({ slug }: Pick<Audit, 'slug'>) =>
      !(
        // audit is NOT in given onlyAuditSlugs
        (
          (onlyAudits.length > 0 && !onlyAuditSlugs.has(slug)) ||
          // audit IS in given skipAuditSlugs
          (skipAudits.length > 0 && skipAuditSlugs.has(slug))
        )
      );
    return {
      audits: audits.filter(filterAudits),
      groups: filterItemRefsBy(groups, filterAudits),
    };
  }
  // return unchanged
  return {
    audits,
    groups,
  };
}
