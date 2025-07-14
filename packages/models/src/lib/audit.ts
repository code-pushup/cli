import { z } from 'zod';
import { metaSchema, slugSchema } from './implementation/schemas.js';
import { errorItems, hasDuplicateStrings } from './implementation/utils.js';

export const auditSchema = z
  .object({
    slug: slugSchema.describe('ID (unique within plugin)'),
  })
  .merge(
    metaSchema({
      titleDescription: 'Descriptive name',
      descriptionDescription: 'Description (markdown)',
      docsUrlDescription: 'Link to documentation (rationale)',
      description: 'List of scorable metrics for the given plugin',
      isSkippedDescription: 'Indicates whether the audit is skipped',
    }),
  );

export type Audit = z.infer<typeof auditSchema>;
export const pluginAuditsSchema = z
  .array(auditSchema)
  .min(1)
  // audit slugs are unique
  .refine(
    auditMetadata => !getDuplicateSlugsInAudits(auditMetadata),
    auditMetadata => ({
      message: duplicateSlugsInAuditsErrorMsg(auditMetadata),
    }),
  )
  .describe('List of audits maintained in a plugin');

// =======================

// helper for validator: audit slugs are unique
function duplicateSlugsInAuditsErrorMsg(audits: Audit[]) {
  const duplicateRefs = getDuplicateSlugsInAudits(audits);
  return `In plugin audits the following slugs are not unique: ${errorItems(
    duplicateRefs,
  )}`;
}

function getDuplicateSlugsInAudits(audits: Audit[]) {
  return hasDuplicateStrings(audits.map(({ slug }) => slug));
}
