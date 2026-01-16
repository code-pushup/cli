import {
  type CategoryRef,
  type PluginConfig,
  validate,
} from '@code-pushup/models';
import {
  expandCategoryRefs,
  extractGroupSlugs,
  pluginUrlContextSchema,
} from '@code-pushup/utils';
import { AXE_PLUGIN_SLUG } from './constants.js';
import { type AxeGroupSlug, isAxeGroupSlug } from './groups.js';

/**
 * @deprecated Use `axeGroupRefs` instead for multi-URL support.
 */
export function axeGroupRef(groupSlug: AxeGroupSlug, weight = 1): CategoryRef {
  return {
    plugin: AXE_PLUGIN_SLUG,
    slug: groupSlug,
    type: 'group',
    weight,
  };
}

/**
 * @deprecated Use `axeAuditRefs` instead for multi-URL support.
 */
export function axeAuditRef(auditSlug: string, weight = 1): CategoryRef {
  return {
    plugin: AXE_PLUGIN_SLUG,
    slug: auditSlug,
    type: 'audit',
    weight,
  };
}

/**
 * Creates category refs for Axe groups with multi-URL support.
 *
 * @param plugin - Axe plugin instance
 * @param groupSlug - Optional group slug; if omitted, includes all groups
 * @param groupWeight - Optional weight for the ref(s)
 * @returns Array of category refs, expanded for each URL in multi-URL configs
 */
export function axeGroupRefs(
  plugin: Pick<PluginConfig, 'groups' | 'context'>,
  groupSlug?: AxeGroupSlug,
  groupWeight?: number,
): CategoryRef[] {
  const context = validate(pluginUrlContextSchema, plugin.context);
  if (groupSlug) {
    return expandCategoryRefs(
      {
        slug: groupSlug,
        weight: groupWeight,
        type: 'group',
        plugin: AXE_PLUGIN_SLUG,
      },
      context,
    );
  }
  return axeGroupSlugs(plugin).flatMap(slug =>
    expandCategoryRefs(
      { slug, type: 'group', plugin: AXE_PLUGIN_SLUG },
      context,
    ),
  );
}

/**
 * Creates category refs for Axe audits with multi-URL support.
 *
 * @param plugin - Axe plugin instance
 * @param auditSlug - Optional audit slug; if omitted, includes all audits
 * @param auditWeight - Optional weight for the ref(s)
 * @returns Array of category refs, expanded for each URL in multi-URL configs
 */
export function axeAuditRefs(
  plugin: Pick<PluginConfig, 'audits' | 'context'>,
  auditSlug?: string,
  auditWeight?: number,
): CategoryRef[] {
  const context = validate(pluginUrlContextSchema, plugin.context);
  if (auditSlug) {
    return expandCategoryRefs(
      {
        slug: auditSlug,
        weight: auditWeight,
        type: 'audit',
        plugin: AXE_PLUGIN_SLUG,
      },
      context,
    );
  }
  return plugin.audits.flatMap(({ slug }) =>
    expandCategoryRefs(
      { slug, type: 'audit', plugin: AXE_PLUGIN_SLUG },
      context,
    ),
  );
}

function axeGroupSlugs(plugin: Pick<PluginConfig, 'groups'>): AxeGroupSlug[] {
  if (!plugin.groups) {
    return [];
  }
  return extractGroupSlugs(plugin.groups).filter(isAxeGroupSlug);
}
