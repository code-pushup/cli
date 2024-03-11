import type { ESLint } from 'eslint';
import { type ZodType, z } from 'zod';

export const eslintPluginConfigSchema = z.object({
  eslintrc: z.union(
    [
      z.string({ description: 'Path to ESLint config file' }),
      z.record(z.string(), z.unknown(), {
        description: 'ESLint config object',
      }) as ZodType<ESLint.ConfigData>,
    ],
    { description: 'ESLint config as file path or inline object' },
  ),
  patterns: z.union([z.string(), z.array(z.string()).min(1)], {
    description:
      'Lint target files. May contain file paths, directory paths or glob patterns',
  }),
});

export type ESLintPluginConfig = z.infer<typeof eslintPluginConfigSchema>;

export type ESLintPluginRunnerConfig = {
  eslintrc: string;
  slugs: string[];
  patterns: string[];
};
