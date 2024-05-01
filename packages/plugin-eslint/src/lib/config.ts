import type { ESLint } from 'eslint';
import { type ZodType, z } from 'zod';
import { toArray } from '@code-pushup/utils';

export const eslintTargetSchema = z.object({
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
export type ESLintTarget = z.infer<typeof eslintTargetSchema>;

export const eslintPluginConfigSchema = z
  .union([eslintTargetSchema, z.array(eslintTargetSchema).min(1)])
  .transform(toArray);
export type ESLintPluginConfig = z.input<typeof eslintPluginConfigSchema>;

export type ESLintPluginRunnerConfig = {
  targets: ESLintTarget[];
  slugs: string[];
};
