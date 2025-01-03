import { z } from 'zod';
import { toArray } from '@code-pushup/utils';

const patternsSchema = z.union([z.string(), z.array(z.string()).min(1)], {
  description:
    'Lint target files. May contain file paths, directory paths or glob patterns',
});

const stylelintrcSchema = z.string({
  description: 'Path to StyleLint config file',
});

const stylelintTargetObjectSchema = z.object({
  stylelintrc: stylelintrcSchema.optional(),
  patterns: patternsSchema,
});
type StyleLintTargetObject = z.infer<typeof stylelintTargetObjectSchema>;

export const stylelintTargetSchema = z
  .union([patternsSchema, stylelintTargetObjectSchema])
  .transform(
    (target): StyleLintTargetObject =>
      typeof target === 'string' || Array.isArray(target)
        ? { patterns: target }
        : target,
  );
export type StyleLintTarget = z.infer<typeof stylelintTargetSchema>;

export const stylelintPluginConfigSchema = z
  .union([stylelintTargetSchema, z.array(stylelintTargetSchema).min(1)])
  .transform(toArray);
export type StyleLintPluginConfig = z.input<typeof stylelintPluginConfigSchema>;

export type StyleLintPluginRunnerConfig = {
  targets: StyleLintTarget[];
  slugs: string[];
};
