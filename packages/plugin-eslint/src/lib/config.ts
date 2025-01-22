import { z } from 'zod';
import { toArray } from '@code-pushup/utils';

const patternsSchema = z.union([z.string(), z.array(z.string()).min(1)], {
  description:
    'Lint target files. May contain file paths, directory paths or glob patterns',
});

const eslintrcSchema = z.string({ description: 'Path to ESLint config file' });

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

const customGroupRulesSchema = z.union(
  [z.array(z.string()).min(1), z.record(z.string(), z.number())],
  {
    description:
      'Array of rule IDs with equal weights or object mapping rule IDs to specific weights',
  },
);

const customGroupSchema = z.object({
  slug: z.string({ description: 'Unique group identifier' }),
  title: z.string({ description: 'Group display title' }),
  description: z.string({ description: 'Group metadata' }).optional(),
  docsUrl: z.string({ description: 'Group documentation site' }).optional(),
  rules: customGroupRulesSchema,
});
export type CustomGroup = z.infer<typeof customGroupSchema>;

export const eslintPluginOptionsSchema = z.object({
  groups: z.array(customGroupSchema).optional(),
});
export type ESLintPluginOptions = z.infer<typeof eslintPluginOptionsSchema>;
