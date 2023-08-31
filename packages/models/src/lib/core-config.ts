import { z } from 'zod';
import { pluginConfigSchema } from './plugins';
import { categoryConfigSchema } from './category-config';
import { uploadConfigSchema } from './upload';
import { persistConfigSchema } from './persist';

/**
 * Define Zod schema for the CoreConfig type
 *
 * @example
 *
 * // Example data for the CoreConfig type
 * const coreConfigData = {
 *   // ... populate with example data ...
 * };
 *
 * // Validate the data against the schema
 * const validationResult = coreConfigSchema.safeParse(coreConfigData);
 *
 * if (validationResult.success) {
 *   console.log('Valid plugin config:', validationResult.data);
 * } else {
 *   console.error('Invalid plugin config:', validationResult.error);
 * }
 */
export const coreConfigSchema = z.object({
  plugins: z.array(pluginConfigSchema, {
    description: 'list of plugins to be used (built-in, 3rd party, or custom)',
  }),
  /** portal configuration for persisting results */
  persist: persistConfigSchema,
  /** portal configuration for uploading results */
  upload: uploadConfigSchema.optional(),
  categories: z.array(categoryConfigSchema, {
    description: 'categorization of individual audits',
  }),
});

export type CoreConfigSchema = z.infer<typeof coreConfigSchema>;
