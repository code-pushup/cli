import { z } from 'zod';
import { createDuplicateSlugsCheck } from './implementation/checks.js';
import {
  nonnegativeNumberSchema,
  scoreSchema,
  scoreTargetSchema,
  slugSchema,
} from './implementation/schemas.js';
import { issueSchema } from './issue.js';
import { tableSchema } from './table.js';
import { treeSchema } from './tree.js';

export const auditValueSchema = nonnegativeNumberSchema.meta({
  description: 'Raw numeric value',
});
export const auditDisplayValueSchema = z
  .string()
  .optional()
  .meta({ description: "Formatted value (e.g. '0.9 s', '2.1 MB')" });

export const auditDetailsSchema = z
  .object({
    issues: z
      .array(issueSchema)
      .meta({ description: 'List of findings' })
      .optional(),
    table: tableSchema('Table of related findings').optional(),
    trees: z
      .array(treeSchema)
      .meta({ description: 'Findings in tree structure' })
      .optional(),
  })
  .meta({
    title: 'AuditDetails',
    description: 'Detailed information',
  });
export type AuditDetails = z.infer<typeof auditDetailsSchema>;

export const auditOutputSchema = z
  .object({
    slug: slugSchema.meta({ description: 'Reference to audit' }),
    displayValue: auditDisplayValueSchema,
    value: auditValueSchema,
    score: scoreSchema,
    scoreTarget: scoreTargetSchema,
    details: auditDetailsSchema.optional(),
  })
  .meta({
    title: 'AuditOutput',
    description: 'Audit information',
  });

export type AuditOutput = z.infer<typeof auditOutputSchema>;

export const auditOutputsSchema = z
  .array(auditOutputSchema)
  .check(createDuplicateSlugsCheck('Audit'))
  .meta({
    title: 'AuditOutputs',
    description:
      'List of JSON formatted audit output emitted by the runner process of a plugin',
  });
export type AuditOutputs = z.infer<typeof auditOutputsSchema>;
