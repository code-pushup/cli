import { z } from 'zod';
import { categoriesSchema } from './category-config.js';
import { createCheck } from './implementation/checks.js';
import { findMissingSlugsInCategoryRefs } from './implementation/utils.js';
import { persistConfigSchema } from './persist-config.js';
import { pluginConfigSchema } from './plugin-config.js';
import { uploadConfigSchema } from './upload-config.js';

export const unrefinedCoreConfigSchema = z.object({
  plugins: z
    .array(pluginConfigSchema)
    .min(1)
    .describe(
      'List of plugins to be used (official, community-provided, or custom)',
    ),
  /** portal configuration for persisting results */
  persist: persistConfigSchema.optional(),
  /** portal configuration for uploading results */
  upload: uploadConfigSchema.optional(),
  categories: categoriesSchema.optional(),
});

export const coreConfigSchema = refineCoreConfig(unrefinedCoreConfigSchema);

/**
 * Add refinements to coreConfigSchema
 * workaround for zod issue: https://github.com/colinhacks/zod/issues/454
 *
 */
export function refineCoreConfig(schema: typeof unrefinedCoreConfigSchema) {
  // categories point to existing audit or group refs
  return schema.check(createCheck(findMissingSlugsInCategoryRefs));
}

export type CoreConfig = z.infer<typeof coreConfigSchema>;
