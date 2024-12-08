import { z } from 'zod';
import { filePathSchema, positiveIntSchema } from './implementation/schemas.js';

export const sourceFileLocationSchema = z.object(
  {
    file: filePathSchema.describe('Relative path to source file in Git repo'),
    position: z
      .object(
        {
          startLine: positiveIntSchema.describe('Start line'),
          startColumn: positiveIntSchema.describe('Start column').optional(),
          endLine: positiveIntSchema.describe('End line').optional(),
          endColumn: positiveIntSchema.describe('End column').optional(),
        },
        { description: 'Location in file' },
      )
      .optional(),
  },
  { description: 'Source file location' },
);

export type SourceFileLocation = z.infer<typeof sourceFileLocationSchema>;
