import {CategoryRef} from "@code-pushup/models";
import {KNIP_PLUGIN_SLUG, type KnipAudits, type KnipGroups} from "./constants";

export function knipCategoryAuditRef(slug: KnipAudits, weight = 1): CategoryRef {
  return knipCategoryRef(slug, weight, 'audit')
}

export function knipCategoryGroupRef(slug: KnipGroups, weight = 1) {
  return knipCategoryRef(slug, weight, 'group')
}

function knipCategoryRef(slug: KnipAudits, weight: number, type: 'audit'): CategoryRef;
function knipCategoryRef(slug: KnipGroups, weight: number, type: 'group'): CategoryRef;
function knipCategoryRef(slug: KnipAudits | KnipGroups, weight: number, type: CategoryRef['type']): CategoryRef {
  return {
    plugin: KNIP_PLUGIN_SLUG,
    slug,
    type,
    weight
  };
}
