import { z } from 'zod';
import {
  metaSchema,
  scorableSchema,
  slugSchema,
  weightedRefSchema,
} from './implementation/schemas.js';
import { errorItems, hasDuplicateStrings } from './implementation/utils.js';

export const categoryRefSchema = weightedRefSchema(
  'Weighted references to audits and/or groups for the category',
  'Slug of an audit or group (depending on `type`)',
).merge(
  z.object({
    type: z.enum(['audit', 'group'], {
      description:
        'Discriminant for reference kind, affects where `slug` is looked up',
    }),
    plugin: slugSchema.describe(
      'Plugin slug (plugin should contain referenced audit or group)',
    ),
  }),
);
export type CategoryRef = z.infer<typeof categoryRefSchema>;

export const categoryConfigSchema = z
  .intersection(
    scorableSchema(
      'Category with a score calculated from audits and groups from various plugins',
      categoryRefSchema,
      getDuplicateRefsInCategoryMetrics,
      duplicateRefsInCategoryMetricsErrorMsg,
    ),
    metaSchema({
      titleDescription: 'Category Title',
      docsUrlDescription: 'Category docs URL',
      descriptionDescription: 'Category description',
      description: 'Meta info for category',
    }),
  )
  .and(
    z.object({
      isBinary: z
        .boolean({
          description:
            'Is this a binary category (i.e. only a perfect score considered a "pass")?',
        })
        .optional(),
    }),
  );

export type CategoryConfig = z.infer<typeof categoryConfigSchema>;

// helper for validator: categories have unique refs to audits or groups
export function duplicateRefsInCategoryMetricsErrorMsg(metrics: CategoryRef[]) {
  const duplicateRefs = getDuplicateRefsInCategoryMetrics(metrics);
  return `In the categories, the following audit or group refs are duplicates: ${errorItems(
    duplicateRefs,
  )}`;
}

function getDuplicateRefsInCategoryMetrics(metrics: CategoryRef[]) {
  return hasDuplicateStrings(
    metrics.map(({ slug, type, plugin }) => `${type} :: ${plugin} / ${slug}`),
  );
}

export const categoriesSchema = z
  .array(categoryConfigSchema, {
    description: 'Categorization of individual audits',
  })
  .refine(
    categoryCfg => !getDuplicateSlugCategories(categoryCfg),
    categoryCfg => ({
      message: duplicateSlugCategoriesErrorMsg(categoryCfg),
    }),
  );

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
