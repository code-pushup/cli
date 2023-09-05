import { z } from 'zod';
import {
  auditOrGroupRefSchema,
  descriptionSchema,
  slugSchema,
  titleSchema,
  weightSchema,
} from './implementation/schemas';
import { errorItems, hasDuplicateStrings } from './implementation/utils';

/**
 *
 * Define Zod schema for the CategoryConfig type
 *
 * @example
 *
 * // Example data for the CategoryConfig type
 * const categoryConfigData = {
 *   slug: 'performance',
 *   title: 'Performance Metrics',
 *   description: 'This category includes performance-related metrics.',
 *   metrics: [
 *     { ref: 'eslint#max-lines', weight: 1 },
 *     { ref: 'groups:lhci#performance', weight: 3 },
 *   ],
 * };
 *
 * // Validate the data against the schema
 * const validationResult = categoryConfigSchema.safeParse(categoryConfigData);
 *
 * if (validationResult.success) {
 *   console.log('Valid category config:', validationResult.data);
 * } else {
 *   console.error('Invalid category config:', validationResult.error);
 * }
 */
export const categoryConfigSchema = z.object(
  {
    slug: slugSchema('Human-readable unique ID'),
    title: titleSchema('Display name for the category '),
    description: descriptionSchema('Optional description in Markdown format'),
    metrics: z
      .array(
        z.object(
          {
            ref: auditOrGroupRefSchema(
              "Reference to a plugin's audit (e.g. 'eslint#max-lines') or group (e.g. 'lhci#group:lcp')",
            ),
            weight: weightSchema(
              'Coefficient for the given score (use weight 0 if only for display)',
            ),
          },
          { description: 'Array of metrics associated with the category' },
        ),
      )
      // metrics have unique refs to audits or groups within a category
      .refine(
        metrics => !getDuplicateRefsInCategoryMetrics(metrics),
        metrics => ({
          message: duplicateRefsInCategoryMetricsErrorMsg(metrics),
        }),
      ),
  },
  {
    description: 'Weighted references to plugin-specific audits/categories',
  },
);

export type CategoryConfigSchema = z.infer<typeof categoryConfigSchema>;

// helper for validator: categories have unique refs to audits or groups
export function duplicateRefsInCategoryMetricsErrorMsg(metrics) {
  const duplicateRefs = getDuplicateRefsInCategoryMetrics(metrics);
  return `In the categories, the following audit or group refs are duplicates: ${errorItems(
    duplicateRefs,
  )}`;
}
function getDuplicateRefsInCategoryMetrics(metrics) {
  return hasDuplicateStrings(metrics.map(({ ref }) => ref));
}
