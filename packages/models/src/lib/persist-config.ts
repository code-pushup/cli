import { z } from 'zod';
import { fileNameSchema, filePathSchema } from './implementation/schemas';

export const formatSchema = z.enum(['json', 'stdout', 'md']);
export type Format = z.infer<typeof formatSchema>;

export const persistConfigSchema = z.object({
  outputDir: filePathSchema('Artifacts folder'),
  /* filename: fileNameSchema(
    'Artifacts file name (without extension)',
  )
    .default('report')
    .optional(),*/
  format: z.array(formatSchema).default(['stdout']).optional(),
});

export type PersistConfig = z.infer<typeof persistConfigSchema>;
