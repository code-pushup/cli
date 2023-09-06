import { Schema, z } from 'zod';
import { pluginConfigSchema } from './plugin-config';
import { categoryConfigSchema } from './category-config';
import { uploadConfigSchema } from './upload-config';
import { persistConfigSchema } from './persist-config';
import {
  hasMissingStrings,
  hasDuplicateStrings,
  errorItems,
} from './implementation/utils';

/**
 * Define Zod schema for the CoreConfig type
 *
 * @example
 *
 * // Example data for the CoreConfig type
 * const data = {
 *   // ... populate with example data ...
 * };
 *
 * // Validate the data against the schema
 * const validationResult = coreConfigSchema.safeParse(data);
 *
 * if (validationResult.success) {
 *   console.log('Valid plugin config:', validationResult.data);
 * } else {
 *   console.error('Invalid plugin config:', validationResult.error);
 * }
 */
export const unrefinedCoreConfigSchema = z.object({
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
    // categories slugs are unique
    .refine(
      categoryCfg => !getDuplicateSlugCategories(categoryCfg),
      categoryCfg => ({
        message: duplicateSlugCategoriesErrorMsg(categoryCfg),
      }),
    ),
});

export const coreConfigSchema = refineCoreConfig(unrefinedCoreConfigSchema);

/**
 * Add refinements to coreConfigSchema
 * workaround for zod issue: https://github.com/colinhacks/zod/issues/454
 *
 */
export function refineCoreConfig(schema: Schema): Schema {
  return (
    schema
      // categories point to existing audit or group refs
      .refine(
        coreCfg => !getMissingRefsForCategories(coreCfg),
        coreCfg => ({
          message: missingRefsForCategoriesErrorMsg(coreCfg),
        }),
      )
  );
}

export type CoreConfigSchema = z.infer<typeof coreConfigSchema>;

// helper for validator: categories point to existing audit or group refs
function missingRefsForCategoriesErrorMsg(coreCfg) {
  const missingRefs = getMissingRefsForCategories(coreCfg);
  return `In the categories, the following plugin refs do not exist in the provided plugins: ${errorItems(
    missingRefs,
  )}`;
}

function isGroupRef(ref: string): boolean {
  return ref.includes('group:');
}

function getMissingRefsForCategories(coreCfg) {
  const missingRefs = [];
  const auditRefsFromCategory = coreCfg.categories.flatMap(({ metrics }) =>
    metrics.filter(({ ref }) => !isGroupRef(ref)).map(({ ref }) => ref),
  );
  const auditRefsFromPlugins = coreCfg.plugins.flatMap(({ audits, meta }) => {
    const pluginSlug = meta.slug;
    return audits.map(({ slug }) => `${pluginSlug}#${slug}`);
  });
  const missingAuditRefs = hasMissingStrings(
    auditRefsFromCategory,
    auditRefsFromPlugins,
  );

  if (Array.isArray(missingAuditRefs) && missingAuditRefs.length > 0) {
    missingRefs.push(...missingAuditRefs);
  }
  const groupRefsFromCategory = coreCfg.categories.flatMap(({ metrics }) =>
    metrics.filter(({ ref }) => isGroupRef(ref)).map(({ ref }) => ref),
  );
  const groupRefsFromPlugins = coreCfg.plugins.flatMap(({ groups, meta }) => {
    return groups.map(({ slug }) => `${meta.slug}#group:${slug}`);
  });
  const missingGroupRefs = hasMissingStrings(
    groupRefsFromCategory,
    groupRefsFromPlugins,
  );
  if (Array.isArray(missingGroupRefs) && missingGroupRefs.length > 0) {
    missingRefs.push(...missingGroupRefs);
  }

  return missingRefs.length ? missingRefs : false;
}

// helper for validator: categories slugs are unique
function duplicateSlugCategoriesErrorMsg(categoryCfg) {
  const duplicateStringSlugs = getDuplicateSlugCategories(categoryCfg);
  return `In the categories, the following slugs are duplicated: ${errorItems(
    duplicateStringSlugs,
  )}`;
}

function getDuplicateSlugCategories(categoryCfg) {
  return hasDuplicateStrings(categoryCfg.map(({ slug }) => slug));
}
