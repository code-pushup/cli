import {z} from 'zod';

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
 *     { ref: 'eslint#max-lines', weight: 0.5 },
 *     { ref: 'categories:lhci#performance', weight: 0.8 },
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
    slug: z.string({
      description: 'Human-readable unique ID',
    }),
    title: z.string({
      description: 'Display name for the category',
    }),
    description: z
      .string({
        description: 'Optional description in Markdown format',
      })
      .optional(),
    metrics: z.array(
      z.object({
        ref: z.string({
          description:
            "Reference to a plugin's audit (e.g. 'eslint#max-lines') or category (e.g. 'categories:lhci#performance')",
        }),
        weight: z.number({
          description:
            'Coefficient for the given score (use weight 0 if only for display)',
        }).default(0).optional(),
      }, {description: "Array of metrics associated with the category"})
    ),
  },
  {
    description: 'Weighted references to plugin-specific audits/categories',
  },
);

export type CategoryConfigSchema = z.infer<typeof categoryConfigSchema>;
