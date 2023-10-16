import { CategoryConfig, categoryConfigSchema } from './category-config';
import {
  errorItems,
  hasDuplicateStrings,
  hasMissingStrings,
} from './implementation/utils';
import { persistConfigSchema } from './persist-config';
import { pluginConfigSchema } from './plugin-config';
import { uploadConfigSchema } from './upload-config';
import { Schema, z } from 'zod';

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

export type CoreConfig = z.infer<typeof unrefinedCoreConfigSchema>;

// helper for validator: categories point to existing audit or group refs
function missingRefsForCategoriesErrorMsg(coreCfg: CoreConfig) {
  const missingRefs = getMissingRefsForCategories(coreCfg);
  return `In the categories, the following plugin refs do not exist in the provided plugins: ${errorItems(
    missingRefs,
  )}`;
}

function getMissingRefsForCategories(coreCfg: CoreConfig) {
  const missingRefs: string[] = [];
  const auditRefsFromCategory = coreCfg.categories.flatMap(({ refs }) =>
    refs
      .filter(({ type }) => type === 'Audit')
      .map(({ plugin, slug }) => `${plugin}/${slug}`),
  );
  const auditRefsFromPlugins = coreCfg.plugins.flatMap(
    ({ audits, slug: pluginSlug }) => {
      return audits.map(({ slug }) => `${pluginSlug}/${slug}`);
    },
  );
  const missingAuditRefs = hasMissingStrings(
    auditRefsFromCategory,
    auditRefsFromPlugins,
  );

  if (Array.isArray(missingAuditRefs) && missingAuditRefs.length > 0) {
    missingRefs.push(...missingAuditRefs);
  }
  const groupRefsFromCategory = coreCfg.categories.flatMap(({ refs }) =>
    refs
      .filter(({ type }) => type === 'Group')
      .map(({ plugin, slug }) => `${plugin}#${slug} (group)`),
  );
  const groupRefsFromPlugins = coreCfg.plugins.flatMap(
    ({ groups, slug: pluginSlug }) => {
      return Array.isArray(groups)
        ? groups.map(({ slug }) => `${pluginSlug}#${slug} (group)`)
        : [];
    },
  );
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
function duplicateSlugCategoriesErrorMsg(categories: CategoryConfig[]) {
  const duplicateStringSlugs = getDuplicateSlugCategories(categories);
  return `In the categories, the following slugs are duplicated: ${errorItems(
    duplicateStringSlugs,
  )}`;
}

function getDuplicateSlugCategories(categories: CategoryConfig[]) {
  return hasDuplicateStrings(categories.map(({ slug }) => slug));
}
