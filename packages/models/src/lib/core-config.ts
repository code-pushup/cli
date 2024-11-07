import { z } from 'zod';
import { categoriesSchema } from './category-config';
import {
  getMissingRefsForCategories,
  missingRefsForCategoriesErrorMsg,
} from './implementation/utils';
import { persistConfigSchema } from './persist-config';
import { pluginConfigSchema } from './plugin-config';
import { uploadConfigSchema } from './upload-config';

export const unrefinedCoreConfigSchema = z.object({
  plugins: z
    .array(pluginConfigSchema, {
      description:
        'List of plugins to be used (official, community-provided, or custom)',
    })
    .min(1),
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
  return schema.refine(
    ({ plugins, categories }) =>
      !getMissingRefsForCategories(plugins, categories),
    ({ plugins, categories }) => ({
      message: missingRefsForCategoriesErrorMsg(plugins, categories),
    }),
  ) as unknown as typeof unrefinedCoreConfigSchema;
}

export type CoreConfig = z.infer<typeof unrefinedCoreConfigSchema>;
