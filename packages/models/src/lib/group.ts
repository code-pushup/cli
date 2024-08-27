import { z } from 'zod';
import {
  type WeightedRef,
  metaSchema,
  scorableSchema,
  weightedRefSchema,
} from './implementation/schemas';
import {
  errorItems,
  exists,
  hasDuplicateStrings,
} from './implementation/utils';

export const groupRefSchema = weightedRefSchema(
  'Weighted reference to a group',
  "Reference slug to a group within this plugin (e.g. 'max-lines')",
);
export type GroupRef = z.infer<typeof groupRefSchema>;

export const groupMetaSchema = metaSchema({
  titleDescription: 'Descriptive name for the group',
  descriptionDescription: 'Description of the group (markdown)',
  docsUrlDescription: 'Group documentation site',
  description: 'Group metadata',
});
export type GroupMeta = z.infer<typeof groupMetaSchema>;

export const groupSchema = scorableSchema(
  'A group aggregates a set of audits into a single score which can be referenced from a category. ' +
    'E.g. the group slug "performance" groups audits and can be referenced in a category',
  groupRefSchema,
  getDuplicateRefsInGroups,
  duplicateRefsInGroupsErrorMsg,
).merge(groupMetaSchema);
export type Group = z.infer<typeof groupSchema>;

export const groupsSchema = z
  .array(groupSchema, {
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
function duplicateRefsInGroupsErrorMsg(groups: WeightedRef[]) {
  const duplicateRefs = getDuplicateRefsInGroups(groups);
  return `In plugin groups the following references are not unique: ${errorItems(
    duplicateRefs,
  )}`;
}

function getDuplicateRefsInGroups(groups: WeightedRef[]) {
  return hasDuplicateStrings(groups.map(({ slug: ref }) => ref).filter(exists));
}

// helper for validator: group refs are unique
function duplicateSlugsInGroupsErrorMsg(groups: Group[] | undefined) {
  const duplicateRefs = getDuplicateSlugsInGroups(groups);
  return `In groups the following slugs are not unique: ${errorItems(
    duplicateRefs,
  )}`;
}

function getDuplicateSlugsInGroups(groups: Group[] | undefined) {
  return Array.isArray(groups)
    ? hasDuplicateStrings(groups.map(({ slug }) => slug))
    : false;
}
