import { z } from 'zod';
import { generalFilePathSchema } from './implementation/schemas';

/**
 * Define Zod schema for the GlobalCliArgs type
 *
 * @example
 *
 * // Example data for the GlobalCliArgs type
 * const args = {
 *  // ...
 * };
 *
 * // Validate the data against the schema
 * const validationResult = globalCliArgsSchema.safeParse(args);
 *
 * if (validationResult.success) {
 *   console.log('Valid config:', validationResult.data);
 * } else {
 *   console.error('Invalid config:', validationResult.error);
 * }
 *
 */
export const globalCliArgsSchema = z.object({
  interactive: z
    .boolean({
      description:
        'flag if interactivity should be considered. Useful for CI runs.',
    })
    .default(true),
  verbose: z
    .boolean({
      description: 'Outputs additional information for a run',
    })
    .default(false),
  configPath: generalFilePathSchema(
    "Path to config file in format `ts` or `mjs`. defaults to 'code-pushup.config.js'",
  )
    .optional()
    .default('code-pushup.config.js'),
});

export type GlobalCliArgs = z.infer<typeof globalCliArgsSchema>;
