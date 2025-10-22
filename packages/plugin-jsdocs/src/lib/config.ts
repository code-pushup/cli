import { z } from 'zod';
import { pluginScoreTargetsSchema } from '@code-pushup/models';

const patternsSchema = z
  .union([z.string(), z.array(z.string()).min(1)])
  .meta({ description: 'Glob pattern to match source files to evaluate.' });

const jsDocsTargetObjectSchema = z
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
    scoreTargets: pluginScoreTargetsSchema,
  })
  .refine(data => !(data.skipAudits && data.onlyAudits), {
    message: "You can't define 'skipAudits' and 'onlyAudits' simultaneously",
    path: ['skipAudits', 'onlyAudits'],
  });

export const jsDocsPluginConfigSchema = z
  .union([patternsSchema, jsDocsTargetObjectSchema])
  .transform(target =>
    typeof target === 'string' || Array.isArray(target)
      ? { patterns: target }
      : target,
  );

/** Type of the config that is passed to the plugin */
export type JsDocsPluginConfig = z.input<typeof jsDocsPluginConfigSchema>;

/** Same as JsDocsPluginConfig but processed so the config is already an object even if it was passed the array of patterns */
export type JsDocsPluginTransformedConfig = z.infer<
  typeof jsDocsPluginConfigSchema
>;
