import { z } from 'zod';

/**
 * Define Zod schema for the PersistConfig type
 *
 * @example
 *
 * // Example data for the UploadConfig type
 * const uploadConfigData = {
 *   server: 'https://example.com/api',
 *   apiKey: 'your-api-key',
 * };
 *
 * // Validate the data against the schema
 * const validationResult = uploadConfigSchema.safeParse(uploadConfigData);
 *
 * if (validationResult.success) {
 *   console.log('Valid persist config:', validationResult.data);
 * } else {
 *   console.error('Invalid persist config:', validationResult.error);
 * }
 *
 */
export const persistConfigSchema = z.object({
  outputPath: z.string({
    description: 'Artefacts folder',
  }),
});

export type PersistConfigSchema = z.infer<typeof persistConfigSchema>;
