import { z } from 'zod';

/**
 * Define Zod schema for the GlobalCliArgs type
 *
 * @example
 *
 * // Example data for the GlobalCliArgs type
 * const uploadConfigData = {
 *   server: 'https://example.com/api',
 *   apiKey: 'your-api-key',
 * };
 *
 * // Validate the data against the schema
 * const validationResult = globalCliArgsSchema.safeParse(globalCliArgsData);
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
  configPath: z
    .string({
      description: "Path to config.js. defaults to 'cpu-config.js'",
    })
    .optional()
    .default('cpu-config.js'),
});

export type GlobalCliArgsSchema = z.infer<typeof globalCliArgsSchema>;
