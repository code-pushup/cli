import { z } from 'zod';
import { issueSchema } from './audit-issue';
import { positiveIntSchema, slugSchema } from './implementation/schemas';
import { errorItems, hasDuplicateStrings } from './implementation/utils';

export const auditOutputSchema = z.object(
  {
    slug: slugSchema('Reference to audit'),
    displayValue: z
      .string({ description: "Formatted value (e.g. '0.9 s', '2.1 MB')" })
      .optional(),
    value: positiveIntSchema('Raw numeric value'),
    score: z
      .number({
        description: 'Value between 0 and 1',
      })
      .min(0)
      .max(1),
    details: z
      .object(
        {
          issues: z.array(issueSchema, { description: 'List of findings' }),
        },
        { description: 'Detailed information' },
      )
      .optional(),
  },
  { description: 'Audit information' },
);

export type AuditOutput = z.infer<typeof auditOutputSchema>;

export const auditOutputsSchema = z
  .array(auditOutputSchema, {
    description:
      'List of JSON formatted audit output emitted by the runner process of a plugin',
  })
  // audit slugs are unique
  .refine(
    audits => !getDuplicateSlugsInAudits(audits),
    audits => ({ message: duplicateSlugsInAuditsErrorMsg(audits) }),
  );
export type AuditOutputs = z.infer<typeof auditOutputsSchema>;

// helper for validator: audit slugs are unique
function duplicateSlugsInAuditsErrorMsg(audits: AuditOutput[]) {
  const duplicateRefs = getDuplicateSlugsInAudits(audits);
  return `In plugin audits the slugs are not unique: ${errorItems(
    duplicateRefs,
  )}`;
}

function getDuplicateSlugsInAudits(audits: AuditOutput[]) {
  return hasDuplicateStrings(audits.map(({ slug }) => slug));
}
