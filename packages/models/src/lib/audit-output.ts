import { z } from 'zod';
import {
  nonnegativeNumberSchema,
  scoreSchema,
  slugSchema,
} from './implementation/schemas.js';
import { errorItems, hasDuplicateStrings } from './implementation/utils.js';
import { issueSchema } from './issue.js';
import { tableSchema } from './table.js';

export const auditValueSchema =
  nonnegativeNumberSchema.describe('Raw numeric value');
export const auditDisplayValueSchema = z
  .string({ description: "Formatted value (e.g. '0.9 s', '2.1 MB')" })
  .optional();

export const auditDetailsSchema = z.object(
  {
    issues: z
      .array(issueSchema, { description: 'List of findings' })
      .optional(),
    table: tableSchema('Table of related findings').optional(),
  },
  { description: 'Detailed information' },
);
export type AuditDetails = z.infer<typeof auditDetailsSchema>;

export const auditOutputSchema = z.object(
  {
    slug: slugSchema.describe('Reference to audit'),
    displayValue: auditDisplayValueSchema,
    value: auditValueSchema,
    score: scoreSchema,
    details: auditDetailsSchema.optional(),
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
