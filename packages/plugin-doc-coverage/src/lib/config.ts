import { z } from 'zod';

export type DocType = 'percentage-coverage';

export const docCoveragePluginConfigSchema = z.object({
  sourceGlob: z
    .string({
      description: 'Glob pattern to find source files',
    })
    .default('src/**/*.{ts,tsx}'),
});

export type DocCoveragePluginConfig = z.infer<
  typeof docCoveragePluginConfigSchema
>;
