import { z } from 'zod';
import { MAX_ISSUE_MESSAGE_LENGTH } from './implementation/limits';
import { filePathSchema, positiveIntSchema } from './implementation/schemas';

const sourceFileLocationSchema = z.object(
  {
    file: filePathSchema('Relative path to source file in Git repo'),
    position: z
      .object(
        {
          startLine: positiveIntSchema('Start line'),
          startColumn: positiveIntSchema('Start column').optional(),
          endLine: positiveIntSchema('End line').optional(),
          endColumn: positiveIntSchema('End column').optional(),
        },
        { description: 'Location in file' },
      )
      .optional(),
  },
  { description: 'Source file location' },
);

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
