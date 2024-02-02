import { z } from 'zod';

export const coverageTypeSchema = z.enum(['function', 'branch', 'line']);
export type CoverageType = z.infer<typeof coverageTypeSchema>;

export const coverageReportSchema = z.object({
  resultsPath: z.string().includes('lcov'),
  pathToProject: z
    .string({
      description:
        'Path from workspace root to project root. Necessary for LCOV reports.',
    })
    .optional(),
});
export type CoverageReport = z.infer<typeof coverageReportSchema>;

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
  coverageTypes: z
    .array(coverageTypeSchema, {
      description: 'Coverage types measured. Defaults to all available types.',
    })
    .min(1)
    .default(['function', 'branch', 'line']),
  reports: z
    .array(coverageReportSchema, {
      description:
        'Path to all code coverage report files. Only LCOV format is supported for now.',
    })
    .min(1),
  perfectScoreThreshold: z
    .number({
      description:
        'Score will be 1 (perfect) for this coverage and above. Score range is 0 - 1.',
    })
    .gt(0)
    .max(1)
    .optional(),
});
export type CoveragePluginConfig = z.input<typeof coveragePluginConfigSchema>;
