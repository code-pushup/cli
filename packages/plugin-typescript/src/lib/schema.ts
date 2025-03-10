import { z } from 'zod';
import { AUDITS, DEFAULT_TS_CONFIG } from './constants.js';
import type { AuditSlug } from './types.js';

const auditSlugs = AUDITS.map(({ slug }) => slug) as [
  AuditSlug,
  ...AuditSlug[],
];
export const typescriptPluginConfigSchema = z.object({
  tsconfig: z
    .string({
      description: 'Path to a tsconfig file (default is tsconfig.json)',
    })
    .default(DEFAULT_TS_CONFIG),
  onlyAudits: z
    .array(z.enum(auditSlugs), {
      description: 'Filters TypeScript compiler errors by diagnostic codes',
    })
    .optional(),
});

export type TypescriptPluginOptions = z.input<
  typeof typescriptPluginConfigSchema
>;
export type TypescriptPluginConfig = z.infer<
  typeof typescriptPluginConfigSchema
>;
