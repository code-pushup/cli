import { z } from 'zod';
import { metaSchema, slugSchema } from './implementation/schemas';
import { errorItems, hasDuplicateStrings } from './implementation/utils';

export const auditSchema = z
  .object({
    slug: slugSchema('ID (unique within plugin)'),
  })
  .merge(
    metaSchema({
      titleDescription: 'Descriptive name',
      descriptionDescription: 'Description (markdown)',
      docsUrlDescription: 'Link to documentation (rationale)',
      description: 'List of scorable metrics for the given plugin',
    }),
  );

export type Audit = z.infer<typeof auditSchema>;
export const pluginAuditsSchema = z
  .array(auditSchema, {
    description: 'List of audits maintained in a plugin',
  })
  // audit slugs are unique
  .refine(
    auditMetadata => !getDuplicateSlugsInAudits(auditMetadata),
    auditMetadata => ({
      message: duplicateSlugsInAuditsErrorMsg(auditMetadata),
    }),
  );
export type PluginAudits = z.infer<typeof pluginAuditsSchema>;
// =======================

// helper for validator: audit slugs are unique
function duplicateSlugsInAuditsErrorMsg(audits: Audit[]) {
  const duplicateRefs = getDuplicateSlugsInAudits(audits);
  return `In plugin audits the slugs are not unique: ${errorItems(
    duplicateRefs,
  )}`;
}

function getDuplicateSlugsInAudits(audits: Audit[]) {
  return hasDuplicateStrings(audits.map(({ slug }) => slug));
}
