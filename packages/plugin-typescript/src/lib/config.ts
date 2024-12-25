import { z } from 'zod';
import type { AuditSlug } from './types.js';
import {AUDITS} from "./constants.js";

const auditSlugs = AUDITS.map(({ slug }) => slug) as [string, ...string[]];
export const typescriptPluginConfigSchema = z.object({
  tsConfigPath: z.string().describe('Path to the TsConfig'),
  onlyAudits: z
    .array(z.enum(auditSlugs))
    .optional()
    .describe('Array with specific TsCodes to measure'),
});

export type TypescriptPluginOptions = z.infer<
  typeof typescriptPluginConfigSchema
> & { onlyAudits?: (string | AuditSlug)[] | undefined };
