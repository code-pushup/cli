import { z } from 'zod';
import { pluginConfigSchema } from './plugins';
import { categoryConfigSchema } from './category-config';
import { uploadConfigSchema } from './upload';
import { persistConfigSchema } from './persist';
import { stringsExist, stringsUnique } from './implementation/utils';

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
export const coreConfigSchema = z
  .object({
    plugins: z.array(pluginConfigSchema, {
      description:
        'List of plugins to be used (official, community-provided, or custom)',
    }),
    /** portal configuration for persisting results */
    persist: persistConfigSchema,
    /** portal configuration for uploading results */
    upload: uploadConfigSchema.optional(),
    categories: z
      .array(categoryConfigSchema, {
        description: 'Categorization of individual audits',
      })
      .refine(
        categoryCfg => {
          return stringsUnique(categoryCfg.map(({ slug }) => slug)) === true;
        },
        categoryCfg => {
          const duplicateStrings = stringsUnique(
            categoryCfg.map(({ slug }) => slug),
          );
          const duplicateStringSlugs =
            duplicateStrings !== true ? duplicateStrings.join(', ') : '';
          return {
            message: `In the categories, the following slugs are duplicated: ${duplicateStringSlugs}`,
          };
        },
      )
      .refine(
        categoryCfg =>
          stringsUnique(
            categoryCfg.flatMap(({ metrics }) => metrics.map(({ ref }) => ref)),
          ) === true,
        categoryCfg => {
          const duplicateStrings = stringsUnique(
            categoryCfg.flatMap(({ metrics }) => metrics.map(({ ref }) => ref)),
          );
          const duplicateStringRefs =
            duplicateStrings !== true ? duplicateStrings.join(', ') : '';
          return {
            message: `In the categories, the following audit ref's are duplicates: ${duplicateStringRefs}`,
          };
        },
      ),
  })
  .refine(
    coreCfg => {
      return getMissingRefs(coreCfg) === true;
    },
    coreCfg => {
      const missingRefs = getMissingRefs(coreCfg);
      const nonExistingRefs = missingRefs !== true ? missingRefs : [];
      return {
        message: categoryMissingPluginRefMsg(nonExistingRefs),
      };
    },
  );

function categoryMissingPluginRefMsg(missingRefs: string[]) {
  return `In the categories, the following plugin ref's do not exist in the provided plugins: ${missingRefs.join(
    ', ',
  )}`;
}
function getMissingRefs(coreCfg) {
  return stringsExist(
    coreCfg.categories.flatMap(({ metrics }) => metrics.map(({ ref }) => ref)),
    coreCfg.plugins.flatMap(({ audits, meta }) => {
      const pluginSlug = meta.slug;
      return audits.map(({ slug }) => pluginSlug + '#' + slug);
    }),
  );
}

export type CoreConfigSchema = z.infer<typeof coreConfigSchema>;
