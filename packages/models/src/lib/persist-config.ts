import { z } from 'zod';
import { fileNameSchema, filePathSchema } from './implementation/schemas.js';

export const formatSchema = z.enum(['json', 'md']);
export type Format = z.infer<typeof formatSchema>;

export const persistConfigSchema = z.object({
  outputDir: filePathSchema.describe('Artifacts folder').optional(),
  filename: fileNameSchema
    .describe('Artifacts file name (without extension)')
    .optional(),
  format: z.array(formatSchema).optional(),
  report: z.boolean().optional(),
});

export type PersistConfig = z.infer<typeof persistConfigSchema>;
