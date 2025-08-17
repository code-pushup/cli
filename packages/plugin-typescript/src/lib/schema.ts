import { z } from 'zod';
import { AUDITS, DEFAULT_TS_CONFIG } from './constants.js';
import type { AuditSlug } from './types.js';

const auditSlugs = AUDITS.map(({ slug }) => slug) as [
  AuditSlug,
  ...AuditSlug[],
];
export const typescriptPluginConfigSchema = z.object({
  tsconfig: z
    .string()
    .default(DEFAULT_TS_CONFIG)
    .describe(`Path to a tsconfig file (default is ${DEFAULT_TS_CONFIG})`),
  onlyAudits: z
    .array(z.enum(auditSlugs))
    .describe('Filters TypeScript compiler errors by diagnostic codes')
    .optional(),
});

export type TypescriptPluginOptions = z.input<
  typeof typescriptPluginConfigSchema
>;
export type TypescriptPluginConfig = z.infer<
  typeof typescriptPluginConfigSchema
>;
