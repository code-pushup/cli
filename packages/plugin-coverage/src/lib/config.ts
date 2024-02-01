import { z } from 'zod';

export const coverageTypeSchema = z.enum(['function', 'branch', 'line']);
export type CoverageType = z.infer<typeof coverageTypeSchema>;

export const coveragePluginConfigSchema = z.object({
  coverageToolCommand: z
    .object({
      command: z
        .string({ description: 'Command to run coverage tool.' })
        .min(1),
      args: z
        .array(z.string(), {
          description: 'Arguments to be passed to the coverage tool.',
        })
        .optional(),
    })
    .optional(),
  coverageType: z.array(coverageTypeSchema).min(1),
  reports: z
    .array(z.string().includes('lcov'), {
      description:
        'Path to all code coverage report files. Only LCOV format is supported for now.',
    })
    .min(1),
  perfectScoreThreshold: z
    .number({ description: 'Score will be 100 for this coverage and above.' })
    .min(1)
    .max(100)
    .optional(),
});

export type CoveragePluginConfig = z.infer<typeof coveragePluginConfigSchema>;
