import { z } from 'zod';
import {
  descriptionSchema,
  refSchema,
  slugSchema,
  titleSchema,
} from './implementation/schemas';

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
 *     { ref: 'categories:lhci#performance', weight: 3 },
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
    metrics: z.array(
      z.object(
        {
          ref: refSchema(
            "Reference to a plugin's audit (e.g. 'eslint#max-lines') or group (e.g. 'groups:lhci#performance')",
          ),
          weight: z
            .number({
              description:
                'Coefficient for the given score (use weight 0 if only for display)',
            })
            .int()
            .nonnegative(),
        },
        { description: 'Array of metrics associated with the category' },
      ),
    ),
  },
  {
    description: 'Weighted references to plugin-specific audits/categories',
  },
);

export type CategoryConfigSchema = z.infer<typeof categoryConfigSchema>;
