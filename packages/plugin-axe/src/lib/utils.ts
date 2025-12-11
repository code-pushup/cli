import type { CategoryRef } from '@code-pushup/models';
import { AXE_PLUGIN_SLUG } from './constants.js';
import type { AxeGroupSlug } from './groups.js';

export function axeGroupRef(groupSlug: AxeGroupSlug, weight = 1): CategoryRef {
  return {
    plugin: AXE_PLUGIN_SLUG,
    slug: groupSlug,
    type: 'group',
    weight,
  };
}

export function axeAuditRef(auditSlug: string, weight = 1): CategoryRef {
  return {
    plugin: AXE_PLUGIN_SLUG,
    slug: auditSlug,
    type: 'audit',
    weight,
  };
}
