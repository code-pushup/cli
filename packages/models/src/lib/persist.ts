import {z} from 'zod';
import {generalFilePathSchema} from "./implementation/schemas";

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
  outputPath: generalFilePathSchema('Artefacts folder'),
});

export type PersistConfigSchema = z.infer<typeof persistConfigSchema>;
