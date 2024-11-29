import { z } from 'zod';
import { MAX_ISSUE_MESSAGE_LENGTH } from './implementation/limits.js';
import { sourceFileLocationSchema } from './source.js';

export const issueSeveritySchema = z.enum(['info', 'warning', 'error'], {
  description: 'Severity level',
});
export type IssueSeverity = z.infer<typeof issueSeveritySchema>;
export const issueSchema = z.object(
  {
    message: z
      .string({ description: 'Descriptive error message' })
      .max(MAX_ISSUE_MESSAGE_LENGTH),
    severity: issueSeveritySchema,
    source: sourceFileLocationSchema.optional(),
  },
  { description: 'Issue information' },
);
export type Issue = z.infer<typeof issueSchema>;
