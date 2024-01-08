import { z } from 'zod';
import {
  WeightedRef,
  metaSchema,
  scorableSchema,
  weightedRefSchema,
} from './implementation/schemas';
import {
  errorItems,
  exists,
  hasDuplicateStrings,
} from './implementation/utils';

export const auditGroupRefSchema = weightedRefSchema(
  'Weighted references to audits',
  "Reference slug to an audit within this plugin (e.g. 'max-lines')",
);
export type AuditGroupRef = z.infer<typeof auditGroupRefSchema>;

export const auditGroupMetaSchema = metaSchema({
  titleDescription: 'Descriptive name for the group',
  descriptionDescription: 'Description of the group (markdown)',
  docsUrlDescription: 'Group documentation site',
  description: 'Group metadata',
});
export type AuditGroupMeta = z.infer<typeof auditGroupMetaSchema>;

export const auditGroupSchema = scorableSchema(
  'An audit group aggregates a set of audits into a single score which can be referenced from a category. ' +
    'E.g. the group slug "performance" groups audits and can be referenced in a category',
  auditGroupRefSchema,
  getDuplicateRefsInGroups,
  duplicateRefsInGroupsErrorMsg,
).merge(auditGroupMetaSchema);
export type AuditGroup = z.infer<typeof auditGroupSchema>;

export const auditGroupsSchema = z
  .array(auditGroupSchema, {
    description: 'List of groups',
  })
  .optional()
  .refine(
    groups => !getDuplicateSlugsInGroups(groups),
    groups => ({
      message: duplicateSlugsInGroupsErrorMsg(groups),
    }),
  );

// ============

// helper for validator: group refs are unique
function duplicateRefsInGroupsErrorMsg(groupAudits: WeightedRef[]) {
  const duplicateRefs = getDuplicateRefsInGroups(groupAudits);
  return `In plugin groups the audit refs are not unique: ${errorItems(
    duplicateRefs,
  )}`;
}

function getDuplicateRefsInGroups(groupAudits: WeightedRef[]) {
  return hasDuplicateStrings(
    groupAudits.map(({ slug: ref }) => ref).filter(exists),
  );
}

// helper for validator: group refs are unique
function duplicateSlugsInGroupsErrorMsg(groups: AuditGroup[] | undefined) {
  const duplicateRefs = getDuplicateSlugsInGroups(groups);
  return `In groups the slugs are not unique: ${errorItems(duplicateRefs)}`;
}

function getDuplicateSlugsInGroups(groups: AuditGroup[] | undefined) {
  return Array.isArray(groups)
    ? hasDuplicateStrings(groups.map(({ slug }) => slug))
    : false;
}
