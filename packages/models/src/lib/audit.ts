import { z } from 'zod';
import { createDuplicateSlugsCheck } from './implementation/checks.js';
import { metaSchema, slugSchema } from './implementation/schemas.js';

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
  .check(createDuplicateSlugsCheck('Audit'))
  .describe('List of audits maintained in a plugin');
