import { z } from 'zod';
import { generalFilePathSchema } from './implementation/schemas';

/**
 * Define Zod schema for the PersistConfig type
 *
 * @example
 *
 * // Example data for the type
 * const data = {
 *   // ...
 * };
 *
 * // Validate the data against the schema
 * const validationResult = persistConfigSchema.safeParse(data);
 *
 * if (validationResult.success) {
 *   console.log('Valid persist config:', validationResult.data);
 * } else {
 *   console.error('Invalid persist config:', validationResult.error);
 * }
 *
 */
export const persistConfigSchema = z.object({
  outputPath: generalFilePathSchema('Artifacts folder'),
  format: z
    .array(z.enum(['json', 'stdout', 'md']))
    .default(['stdout'])
    .optional(),
});

export type PersistConfig = z.infer<typeof persistConfigSchema>;
