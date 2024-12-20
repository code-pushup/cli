import { z } from 'zod';

export const docCoveragePluginConfigSchema = z.object({
  onlyAudits: z.array(z.string()).optional(),
  sourceGlob: z
    .array(z.string())
    .default(['src/**/*.{ts,tsx}', '!**/*.spec.ts', '!**/*.test.ts']),
});

export type DocCoveragePluginConfig = z.infer<
  typeof docCoveragePluginConfigSchema
>;
