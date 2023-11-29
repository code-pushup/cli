import { z } from 'zod';
import { fileNameSchema, filePathSchema } from './implementation/schemas';

export const formatSchema = z.enum(['json', 'md']);
export type Format = z.infer<typeof formatSchema>;

export const persistConfigSchema = z.object({
  outputDir: filePathSchema('Artifacts folder'),
  filename: fileNameSchema('Artifacts file name (without extension)').default(
    'report',
  ),
  format: z.array(formatSchema).default(['json']).optional(), // @TODO remove default or optional value and otherwise it will not set defaults.
});

export type PersistConfig = z.infer<typeof persistConfigSchema>;
