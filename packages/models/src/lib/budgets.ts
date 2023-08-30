import { z } from 'zod';

/**
 * Define Zod schema for the Budget type
 *
 * @example
 *
 * // Type assertion for valid budget data
 * const validBudget = {
 *   ref: 'eslint#max-lines',
 *   minScore: 0.8,
 *   maxWarnings: 5,
 *   maxValue: 1000,
 * } as z.infer<typeof budgetSchema>;
 *
 * // Validate the data against the schema
 * const validationResult = budgetSchema.safeParse(validBudget);
 *
 * if (validationResult.success) {
 *   console.log('Valid budget:', validationResult.data);
 * } else {
 *   console.error('Invalid budget:', validationResult.error);
 * }
 *
 **/
export const budgetSchema = z.object({
  ref: z.string({
    description:
      "reference to audit ('eslint#max-lines') or category ('categories:performance')",
  }),
  minScore: z
    .number({
      description: 'fail assertion if score too low',
    })
    .min(0)
    .max(1)
    .optional(),
  maxWarnings: z
    .number({
      description: 'fail assertion if too many warnings',
    })
    .optional(),
  maxValue: z
    .number({
      description: 'fail assertion if value too high',
    })
    .optional(),
});

export type BudgetSchema = z.infer<typeof budgetSchema>;
