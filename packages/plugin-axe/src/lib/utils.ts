import type { CategoryRef } from '@code-pushup/models';
import { AXE_PLUGIN_SLUG } from './constants.js';
import type { AxeGroupSlug } from './groups.js';

/** Creates a category ref to an Axe group. */
export function axeGroupRef(groupSlug: AxeGroupSlug, weight = 1): CategoryRef {
  return {
    plugin: AXE_PLUGIN_SLUG,
    slug: groupSlug,
    type: 'group',
    weight,
  };
}

/** Creates a category ref to an Axe audit. */
export function axeAuditRef(auditSlug: string, weight = 1): CategoryRef {
  return {
    plugin: AXE_PLUGIN_SLUG,
    slug: auditSlug,
    type: 'audit',
    weight,
  };
}
