import { z } from 'zod';

export type DocType = 'percentage-coverage';

export const docCoveragePluginConfigSchema = z.object({
  language: z.enum(['javascript', 'typescript'], {
    description: 'Programming language of the source code to analyze',
  }),
  sourceGlob: z
    .string({
      description: 'Glob pattern to find source files',
    })
    .optional(),
  outputFolderPath: z
    .string({
      description: 'Path to the output folder',
    })
    .optional(),
});

export type DocCoveragePluginConfig = z.input<
  typeof docCoveragePluginConfigSchema
>;
