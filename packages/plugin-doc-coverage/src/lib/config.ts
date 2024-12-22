import { z } from 'zod';

export const docCoveragePluginConfigSchema = z
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
    sourceGlob: z
      .array(z.string())
      .default(['src/**/*.{ts,tsx}', '!**/*.spec.ts', '!**/*.test.ts'])
      .describe('Glob pattern to match source files to evaluate.'),
  })
  .refine(data => !(data.skipAudits && data.onlyAudits), {
    message: "You can't define 'skipAudits' and 'onlyAudits' simultaneously",
    path: ['skipAudits', 'onlyAudits'],
  });

export type DocCoveragePluginConfig = z.infer<
  typeof docCoveragePluginConfigSchema
>;
