import { z } from 'zod';
import { categoriesSchema } from './category-config';
import { errorItems, hasMissingStrings } from './implementation/utils';
import { persistConfigSchema } from './persist-config';
import { pluginConfigSchema } from './plugin-config';
import { uploadConfigSchema } from './upload-config';

export const unrefinedCoreConfigSchema = z.object({
  plugins: z.array(pluginConfigSchema, {
    description:
      'List of plugins to be used (official, community-provided, or custom)',
  }),
  /** portal configuration for persisting results */
  persist: persistConfigSchema.optional(),
  /** portal configuration for uploading results */
  upload: uploadConfigSchema.optional(),
  categories: categoriesSchema,
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
    coreCfg => !getMissingRefsForCategories(coreCfg),
    coreCfg => ({
      message: missingRefsForCategoriesErrorMsg(coreCfg),
    }),
  ) as unknown as typeof unrefinedCoreConfigSchema;
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
      .filter(({ type }) => type === 'audit')
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
      .filter(({ type }) => type === 'group')
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
