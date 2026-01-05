import { z } from 'zod';
import { pluginScoreTargetsSchema } from '@code-pushup/models';
import { ALL_COVERAGE_TYPES } from './constants.js';

export const coverageTypeSchema = z
  .enum(ALL_COVERAGE_TYPES)
  .meta({ title: 'CoverageType' });
export type CoverageType = z.infer<typeof coverageTypeSchema>;

export const coverageResultSchema = z
  .union([
    z.object({
      resultsPath: z
        .string()
        .includes('lcov')
        .meta({ description: 'Path to coverage results for Nx setup.' }),
      pathToProject: z
        .string()
        .meta({
          description:
            'Path from workspace root to project root. Necessary for LCOV reports which provide a relative path.',
        })
        .optional(),
    }),
    z.string().includes('lcov').meta({
      description: 'Path to coverage results for a single project setup.',
    }),
  ])
  .meta({ title: 'CoverageResult' });
export type CoverageResult = z.infer<typeof coverageResultSchema>;

export const coveragePluginConfigSchema = z
  .object({
    coverageToolCommand: z
      .object({
        command: z
          .string()
          .min(1)
          .meta({ description: 'Command to run coverage tool.' }),
        args: z.array(z.string()).optional().meta({
          description: 'Arguments to be passed to the coverage tool.',
        }),
      })
      .optional(),
    continueOnCommandFail: z.boolean().default(true).meta({
      description:
        'Continue on coverage tool command failure or error. Defaults to true.',
    }),
    coverageTypes: z
      .array(coverageTypeSchema)
      .min(1)
      .default([...ALL_COVERAGE_TYPES])
      .meta({
        description:
          'Coverage types measured. Defaults to all available types.',
      }),
    reports: z
      .array(coverageResultSchema)
      .min(1)
      .describe(
        'Path to all code coverage report files. Only LCOV format is supported for now.',
      ),
    scoreTargets: pluginScoreTargetsSchema,
  })
  .meta({ title: 'CoveragePluginConfig' });
export type CoveragePluginConfig = z.input<typeof coveragePluginConfigSchema>;
export type FinalCoveragePluginConfig = z.infer<
  typeof coveragePluginConfigSchema
>;
