import { z } from 'zod';
import {
  createDuplicateSlugsCheck,
  createDuplicatesCheck,
} from './implementation/checks.js';
import {
  metaSchema,
  scorableSchema,
  weightedRefSchema,
} from './implementation/schemas.js';
import { formatSlugsList } from './implementation/utils.js';

export const groupRefSchema = weightedRefSchema(
  'Weighted reference to a group',
  "Reference slug to a group within this plugin (e.g. 'max-lines')",
).meta({ title: 'GroupRef' });
export type GroupRef = z.infer<typeof groupRefSchema>;

export const groupMetaSchema = metaSchema({
  titleDescription: 'Descriptive name for the group',
  descriptionDescription: 'Description of the group (markdown)',
  docsUrlDescription: 'Group documentation site',
  description: 'Group metadata',
  isSkippedDescription: 'Indicates whether the group is skipped',
}).meta({ title: 'GroupMeta' });
export type GroupMeta = z.infer<typeof groupMetaSchema>;

export const groupSchema = scorableSchema(
  'A group aggregates a set of audits into a single score which can be referenced from a category. ' +
    'E.g. the group slug "performance" groups audits and can be referenced in a category',
  groupRefSchema,
  createDuplicatesCheck(
    ({ slug }) => slug,
    duplicates =>
      `Group has duplicate references to audits: ${formatSlugsList(duplicates)}`,
  ),
)
  .merge(groupMetaSchema)
  .meta({ title: 'Group' });

export type Group = z.infer<typeof groupSchema>;

export const groupsSchema = z
  .array(groupSchema)
  .check(createDuplicateSlugsCheck('Group'))
  .optional()
  .meta({
    title: 'Groups',
    description: 'List of groups',
  });
