import { z } from 'zod';
import {
  metaSchema,
  scorableSchema,
  slugSchema,
  weightedRefSchema,
} from './implementation/schemas';
import { errorItems, hasDuplicateStrings } from './implementation/utils';

type _RefsList = {
  type?: string;
  slug?: string;
  plugin?: string;
}[];

/** What is being referenced in category config */
export const enum CategoryConfigRefType {
  /** Reference to audit (via slug) */
  Audit = 'audit',
  /** Reference to group of audits (via slug) */
  Group = 'group',
}

export const categoryConfigSchema = scorableSchema(
  'Category with a score calculated from audits and groups from various plugins',
  weightedRefSchema(
    'Weighted references to audits and/or groups for the category',
    'Slug of an audit or group (depending on `type`)',
  ).merge(
    z.object({
      type: z.enum(['audit', 'group'], {
        description:
          'Discriminant for reference kind, affects where `slug` is looked up',
      }),
      plugin: slugSchema(
        'Plugin slug (plugin should contain referenced audit or group)',
      ),
    }),
  ),
  getDuplicateRefsInCategoryMetrics,
  duplicateRefsInCategoryMetricsErrorMsg,
)
  .merge(
    metaSchema({
      titleDescription: 'Category Title',
      docsUrlDescription: 'Category docs URL',
      descriptionDescription: 'Category description',
      description: 'Meta info for category',
    }),
  )
  .merge(
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
export function duplicateRefsInCategoryMetricsErrorMsg(metrics: _RefsList) {
  const duplicateRefs = getDuplicateRefsInCategoryMetrics(metrics);
  return `In the categories, the following audit or group refs are duplicates: ${errorItems(
    duplicateRefs,
  )}`;
}
function getDuplicateRefsInCategoryMetrics(metrics: _RefsList) {
  return hasDuplicateStrings(
    metrics.map(({ slug, type, plugin }) => `${type} :: ${plugin} / ${slug}`),
  );
}
