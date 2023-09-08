import { z } from 'zod';
import {
  descriptionSchema,
  refSchema,
  slugSchema,
  titleSchema,
  weightSchema,
} from './implementation/schemas';
import {
  errorItems,
  exists,
  hasDuplicateStrings,
} from './implementation/utils';

type RefsList = {
  ref?: string;
}[];
/**
 *
 * Define Zod schema for the CategoryConfig type
 *
 * @example
 *
 * // Example data for the CategoryConfig type
 * const data = {
 *  // ...
 * };
 *
 * // Validate the data against the schema
 * const validationResult = categoryConfigSchema.safeParse(data);
 *
 * if (validationResult.success) {
 *   console.log('Valid category config:', validationResult.data);
 * } else {
 *   console.error('Invalid category config:', validationResult.error);
 * }
 */
export const categoryConfigSchema = z.object(
  {
    slug: slugSchema(),
    title: titleSchema('Display name for the category '),
    description: descriptionSchema('Optional description in Markdown format'),
    metrics: z
      .array(
        z.object(
          {
            ref: refSchema(
              "Reference to a plugin's audit (e.g. 'eslint#max-lines') or group (e.g. 'lhci#group:performance')",
            ),
            weight: weightSchema(),
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

export type CategoryConfig = z.infer<typeof categoryConfigSchema>;

// helper for validator: categories have unique refs to audits or groups
export function duplicateRefsInCategoryMetricsErrorMsg(metrics: RefsList) {
  const duplicateRefs = getDuplicateRefsInCategoryMetrics(metrics);
  return `In the categories, the following audit or group refs are duplicates: ${errorItems(
    duplicateRefs,
  )}`;
}
function getDuplicateRefsInCategoryMetrics(metrics: RefsList) {
  return hasDuplicateStrings(metrics.map(({ ref }) => ref).filter(exists));
}
