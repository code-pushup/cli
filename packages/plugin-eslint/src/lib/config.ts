import type { ESLint } from 'eslint';
import { type ZodType, z } from 'zod';
import { toArray } from '@code-pushup/utils';

const patternsSchema = z.union([z.string(), z.array(z.string()).min(1)], {
  description:
    'Lint target files. May contain file paths, directory paths or glob patterns',
});

const eslintrcSchema = z.union(
  [
    z.string({ description: 'Path to ESLint config file' }),
    z.record(z.string(), z.unknown(), {
      description: 'ESLint config object',
    }) as ZodType<ESLint.ConfigData>,
  ],
  { description: 'ESLint config as file path or inline object' },
);

const eslintTargetObjectSchema = z.object({
  eslintrc: eslintrcSchema.optional(),
  patterns: patternsSchema,
});
type ESLintTargetObject = z.infer<typeof eslintTargetObjectSchema>;

export const eslintTargetSchema = z
  .union([patternsSchema, eslintTargetObjectSchema])
  .transform(
    (target): ESLintTargetObject =>
      typeof target === 'string' || Array.isArray(target)
        ? { patterns: target }
        : target,
  );
export type ESLintTarget = z.infer<typeof eslintTargetSchema>;

export const eslintPluginConfigSchema = z
  .union([eslintTargetSchema, z.array(eslintTargetSchema).min(1)])
  .transform(toArray);
export type ESLintPluginConfig = z.input<typeof eslintPluginConfigSchema>;

export type ESLintPluginRunnerConfig = {
  targets: ESLintTarget[];
  slugs: string[];
};
