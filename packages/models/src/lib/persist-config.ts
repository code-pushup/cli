import { z } from 'zod';
import { generalFilePathSchema } from './implementation/schemas';

export const formatSchema = z.enum(['json', 'stdout', 'md']);
export type Format = z.infer<typeof formatSchema>;

export const persistConfigSchema = z.object({
  outputPath: generalFilePathSchema('Artifacts folder'),
  format: z.array(formatSchema).default(['stdout']).optional(),
});

export type PersistConfig = z.infer<typeof persistConfigSchema>;
