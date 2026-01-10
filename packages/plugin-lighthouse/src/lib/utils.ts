import {
  type Audit,
  type CategoryRef,
  type Group,
  type PluginConfig,
  validate,
} from '@code-pushup/models';
import {
  expandCategoryRefs,
  extractGroupSlugs,
  pluginUrlContextSchema,
  toArray,
} from '@code-pushup/utils';
import { LIGHTHOUSE_GROUP_SLUGS, LIGHTHOUSE_PLUGIN_SLUG } from './constants.js';
import type { LighthouseCliFlags } from './runner/types.js';
import type { LighthouseGroupSlug } from './types.js';

/**
 * @deprecated Use `lighthouseGroupRefs` instead for multi-URL support.
 */
export function lighthouseGroupRef(
  groupSlug: LighthouseGroupSlug,
  weight = 1,
): CategoryRef {
  return {
    plugin: LIGHTHOUSE_PLUGIN_SLUG,
    slug: groupSlug,
    type: 'group',
    weight,
  };
}

/**
 * @deprecated Use `lighthouseAuditRefs` instead for multi-URL support.
 */
export function lighthouseAuditRef(auditSlug: string, weight = 1): CategoryRef {
  return {
    plugin: LIGHTHOUSE_PLUGIN_SLUG,
    slug: auditSlug,
    type: 'audit',
    weight,
  };
}

/**
 * Creates category refs for Lighthouse groups with multi-URL support.
 *
 * @param plugin - Lighthouse plugin instance
 * @param groupSlug - Optional group slug; if omitted, includes all groups
 * @param groupWeight - Optional weight for the ref(s)
 * @returns Array of category refs, expanded for each URL in multi-URL configs
 */
export function lighthouseGroupRefs(
  plugin: Pick<PluginConfig, 'groups' | 'context'>,
  groupSlug?: LighthouseGroupSlug,
  groupWeight?: number,
): CategoryRef[] {
  const context = validate(pluginUrlContextSchema, plugin.context);
  if (groupSlug) {
    return expandCategoryRefs(
      {
        plugin: LIGHTHOUSE_PLUGIN_SLUG,
        slug: groupSlug,
        type: 'group',
        weight: groupWeight,
      },
      context,
    );
  }
  return lighthouseGroupSlugs(plugin).flatMap(slug =>
    expandCategoryRefs(
      { plugin: LIGHTHOUSE_PLUGIN_SLUG, slug, type: 'group' },
      context,
    ),
  );
}

/**
 * Creates category refs for Lighthouse audits with multi-URL support.
 *
 * @param plugin - Lighthouse plugin instance
 * @param auditSlug - Optional audit slug; if omitted, includes all audits
 * @param auditWeight - Optional weight for the ref(s)
 * @returns Array of category refs, expanded for each URL in multi-URL configs
 */
export function lighthouseAuditRefs(
  plugin: Pick<PluginConfig, 'audits' | 'context'>,
  auditSlug?: string,
  auditWeight?: number,
): CategoryRef[] {
  const context = validate(pluginUrlContextSchema, plugin.context);
  if (auditSlug) {
    return expandCategoryRefs(
      {
        plugin: LIGHTHOUSE_PLUGIN_SLUG,
        slug: auditSlug,
        type: 'audit',
        weight: auditWeight,
      },
      context,
    );
  }
  return plugin.audits.flatMap(({ slug }) =>
    expandCategoryRefs(
      { plugin: LIGHTHOUSE_PLUGIN_SLUG, slug, type: 'audit' },
      context,
    ),
  );
}

export function lighthouseGroupSlugs(
  plugin: Pick<PluginConfig, 'groups'>,
): LighthouseGroupSlug[] {
  if (!plugin.groups) {
    return [];
  }
  return extractGroupSlugs(plugin.groups).filter(isLighthouseGroupSlug);
}

class NotImplementedError extends Error {
  constructor(plural: string, slugs: string[]) {
    const formattedSlugs = slugs.map(slug => `"${slug}"`).join(', ');
    super(`${plural} not implemented: ${formattedSlugs}`);
  }
}

export function validateAudits(audits: Audit[], onlyAudits: string[]): boolean {
  const missingAudtis = toArray(onlyAudits).filter(
    slug => !audits.some(audit => audit.slug === slug),
  );
  if (missingAudtis.length > 0) {
    throw new NotImplementedError('Audits', missingAudtis);
  }
  return true;
}

export function validateOnlyCategories(
  groups: Group[],
  onlyCategories: string | string[],
): boolean {
  const missingCategories = toArray(onlyCategories).filter(slug =>
    groups.every(group => group.slug !== slug),
  );
  if (missingCategories.length > 0) {
    throw new NotImplementedError('Categories', missingCategories);
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

export function isLighthouseGroupSlug(
  group: unknown,
): group is LighthouseGroupSlug {
  return (
    typeof group === 'string' &&
    LIGHTHOUSE_GROUP_SLUGS.includes(group as LighthouseGroupSlug)
  );
}
