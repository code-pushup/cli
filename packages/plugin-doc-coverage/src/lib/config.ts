import { z } from 'zod';

const patternsSchema = z.union([z.string(), z.array(z.string()).min(1)], {
  description: 'Glob pattern to match source files to evaluate.',
});

const docCoverageTargetObjectSchema = z
  .object({
    skipAudits: z
      .array(z.string())
      .optional()
      .describe(
        'List of audit slugs to exclude from evaluation. When specified, all audits except these will be evaluated.',
      ),
    onlyAudits: z
      .array(z.string())
      .optional()
      .describe(
        'List of audit slugs to evaluate. When specified, only these audits will be evaluated.',
      ),
    patterns: patternsSchema,
  })
  .refine(data => !(data.skipAudits && data.onlyAudits), {
    message: "You can't define 'skipAudits' and 'onlyAudits' simultaneously",
    path: ['skipAudits', 'onlyAudits'],
  });

export const docCoveragePluginConfigSchema = z
  .union([patternsSchema, docCoverageTargetObjectSchema])
  .transform(target =>
    typeof target === 'string' || Array.isArray(target)
      ? { patterns: target }
      : target,
  );

export type DocCoveragePluginConfig = z.infer<
  typeof docCoveragePluginConfigSchema
>;
