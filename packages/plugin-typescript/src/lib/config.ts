import { z } from 'zod';
import type { AuditSlug } from './types.js';

export const typescriptPluginConfigSchema = z.object({
  tsConfigPath: z.string().describe('Path to the TsConfig'),
  tsAudits: z
    .array(z.string())
    .optional()
    .describe('Array with specific TsCodes to measure'),
});

export type TypescriptPluginOptions = z.infer<
  typeof typescriptPluginConfigSchema
> & { tsAudits?: AuditSlug[] | undefined };
