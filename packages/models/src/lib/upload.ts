import { z } from 'zod';

/**
 * Define Zod schema for the UploadConfig type
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
 *   console.log('Valid upload config:', validationResult.data);
 * } else {
 *   console.error('Invalid upload config:', validationResult.error);
 * }
 *
 */
export const uploadConfigSchema = z.object({
  server: z.string({
    description:
      'URL of deployed portal API',
  }),
  apiKey: z.string({
    description:
      'API key with write access to portal (use `process.env` for security)',
  }),
});

export type UploadConfigSchema = z.infer<typeof uploadConfigSchema>;
