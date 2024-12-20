import { z } from 'zod';

export const docCoveragePluginConfigSchema = z
  .object({
    skipAudits: z.array(z.string()).optional(),
    onlyAudits: z.array(z.string()).optional(),
    sourceGlob: z
      .array(z.string())
      .default(['src/**/*.{ts,tsx}', '!**/*.spec.ts', '!**/*.test.ts']),
  })
  .refine(data => !(data.skipAudits && data.onlyAudits), {
    message: "You can't define 'skipAudits' and 'onlyAudits' simultaneously",
    path: ['skipAudits', 'onlyAudits'],
  });

export type DocCoveragePluginConfig = z.infer<
  typeof docCoveragePluginConfigSchema
>;
