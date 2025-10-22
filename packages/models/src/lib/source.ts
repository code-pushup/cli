import { z } from 'zod';
import {
  filePathSchema,
  filePositionSchema,
} from './implementation/schemas.js';

export const sourceFileLocationSchema = z
  .object({
    file: filePathSchema.meta({
      description: 'Relative path to source file in Git repo',
    }),
    position: filePositionSchema.optional(),
  })
  .meta({ description: 'Source file location' });

export type SourceFileLocation = z.infer<typeof sourceFileLocationSchema>;
