import { z } from 'zod';

export const stylelintTypeSchema = z.enum(['function', 'branch', 'line']);
export type CoverageType = z.infer<typeof stylelintTypeSchema>;

export const stylelintResultSchema = z.union([
  z.object({
    resultsPath: z
      .string({
        description: 'Path to stylelint results for Nx setup.',
      })
      .includes('lcov'),
    pathToProject: z
      .string({
        description:
          'Path from workspace root to project root. Necessary for LCOV reports which provide a relative path.',
      })
      .optional(),
  }),
  z
    .string({
      description: 'Path to stylelint results for a single project setup.',
    })
    .includes('lcov'),
]);
export type CoverageResult = z.infer<typeof stylelintResultSchema>;

export const stylelintPluginConfigSchema = z.object({
  rules: z.array(z.string()).optional(),
});
export type StylelintPluginConfig = z.input<typeof stylelintPluginConfigSchema>;
export type FinalCoveragePluginConfig = z.infer<
  typeof stylelintPluginConfigSchema
>;
