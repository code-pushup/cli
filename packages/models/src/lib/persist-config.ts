import { z } from 'zod';
import { fileNameSchema, filePathSchema } from './implementation/schemas';

export const formatSchema = z.enum(['json', 'md']);
export type Format = z.infer<typeof formatSchema>;

export const persistConfigSchema = z.object({
  outputDir: filePathSchema('Artifacts folder').optional(),
  filename: fileNameSchema(
    'Artifacts file name (without extension)',
  ).optional(),
  format: z.array(formatSchema).optional(),
});

export type PersistConfig = z.infer<typeof persistConfigSchema>;
