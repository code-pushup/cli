import { z } from 'zod';
import { filePathSchema } from './implementation/schemas';

export const formatSchema = z.enum(['json', 'stdout', 'md']);
export type Format = z.infer<typeof formatSchema>;

export const persistConfigSchema = z.object({
  outputPath: filePathSchema('Artifacts folder'),
  format: z.array(formatSchema).default(['stdout']).optional(),
});

export type PersistConfig = z.infer<typeof persistConfigSchema>;
