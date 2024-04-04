import { type CliFlags } from 'lighthouse';
import { Audit, CategoryRef, Group } from '@code-pushup/models';
import { filterItemRefsBy, toArray } from '@code-pushup/utils';
import { LIGHTHOUSE_PLUGIN_SLUG } from './constants';
import { LighthouseGroupSlugs } from './runner';

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

type RefinedLighthouseOption = {
  url: CliFlags['_'];
  chromeFlags?: Record<CliFlags['chromeFlags'][number], string>;
};

export type LighthouseCliOptions = RefinedLighthouseOption &
  Partial<Omit<CliFlags, keyof RefinedLighthouseOption>>;

export class AuditsNotImplementedError extends Error {
  constructor(auditSlugs: string[]) {
    super(`audits: "${auditSlugs.join(', ')}" not implemented`);
  }
}

export function validateOnlyAudits(
  audits: Audit[],
  onlyAudits: string | string[],
): boolean {
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

export function filterAuditsAndGroupsByOnlyOptions(
  audits: Audit[],
  groups: Group[],
  options: Pick<CliFlags, 'onlyAudits' | 'onlyCategories'> = {},
): {
  audits: Audit[];
  groups: Group[];
} {
  const { onlyAudits, onlyCategories } = options;

  // category wins over audits
  if (onlyCategories && onlyCategories.length > 0) {
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
  } else if (onlyAudits && onlyAudits.length > 0) {
    validateOnlyAudits(audits, onlyAudits);
    const auditSlugs = new Set(onlyAudits);
    return {
      audits: audits.filter(({ slug }) => auditSlugs.has(slug)),
      groups: filterItemRefsBy(groups, ({ slug }) => auditSlugs.has(slug)),
    };
  }
  // return unchanged
  return {
    audits,
    groups,
  };
}
