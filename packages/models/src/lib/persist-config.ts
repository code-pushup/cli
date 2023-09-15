import { z } from 'zod';
import { generalFilePathSchema } from './implementation/schemas';

export const persistConfigSchema = z.object({
  outputPath: generalFilePathSchema('Artifacts folder'),
  format: z
    .array(z.enum(['json', 'stdout', 'md']))
    .default(['stdout'])
    .optional(),
});

export type PersistConfig = z.infer<typeof persistConfigSchema>;
