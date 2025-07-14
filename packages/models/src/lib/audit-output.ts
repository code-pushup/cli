import { z } from 'zod';
import {
  nonnegativeNumberSchema,
  scoreSchema,
  slugSchema,
} from './implementation/schemas.js';
import { errorItems, hasDuplicateStrings } from './implementation/utils.js';
import { issueSchema } from './issue.js';
import { tableSchema } from './table.js';
import { treeSchema } from './tree.js';

export const auditValueSchema =
  nonnegativeNumberSchema.describe('Raw numeric value');
export const auditDisplayValueSchema = z
  .string()
  .describe("Formatted value (e.g. '0.9 s', '2.1 MB')")
  .optional();

export const auditDetailsSchema = z
  .object({
    issues: z.array(issueSchema).describe('List of findings').optional(),
    table: tableSchema('Table of related findings').optional(),
    trees: z
      .array(treeSchema)
      .describe('Findings in tree structure')
      .optional(),
  })
  .describe('Detailed information');
export type AuditDetails = z.infer<typeof auditDetailsSchema>;

export const auditOutputSchema = z
  .object({
    slug: slugSchema.describe('Reference to audit'),
    displayValue: auditDisplayValueSchema,
    value: auditValueSchema,
    score: scoreSchema,
    details: auditDetailsSchema.optional(),
  })
  .describe('Audit information');

export type AuditOutput = z.infer<typeof auditOutputSchema>;

export const auditOutputsSchema = z
  .array(auditOutputSchema)
  // audit slugs are unique
  .refine(
    audits => !getDuplicateSlugsInAudits(audits),
    audits => ({ message: duplicateSlugsInAuditsErrorMsg(audits) }),
  )
  .describe(
    'List of JSON formatted audit output emitted by the runner process of a plugin',
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
