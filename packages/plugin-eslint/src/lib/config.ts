import { z } from 'zod';

export const eslintPluginConfigSchema = z.object({
  eslintrc: z.string({
    description: 'Path to .eslintrc.* config file',
  }),
  patterns: z.union([z.string(), z.array(z.string()).min(1)], {
    description:
      'Lint target files. May contain file paths, directory paths, or glob patterns',
  }),
});

export type ESLintPluginConfig = z.infer<typeof eslintPluginConfigSchema>;
