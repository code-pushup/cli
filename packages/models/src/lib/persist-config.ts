import { z } from 'zod';
import { fileNameSchema, filePathSchema } from './implementation/schemas.js';

export const formatSchema = z.enum(['json', 'md']).meta({ title: 'Format' });
export type Format = z.infer<typeof formatSchema>;

export const persistConfigSchema = z
  .object({
    outputDir: filePathSchema
      .meta({ description: 'Artifacts folder' })
      .optional(),
    filename: fileNameSchema
      .meta({ description: 'Artifacts file name (without extension)' })
      .optional(),
    format: z.array(formatSchema).optional(),
    skipReports: z.boolean().optional(),
  })
  .meta({ title: 'PersistConfig' });

export type PersistConfig = z.infer<typeof persistConfigSchema>;
