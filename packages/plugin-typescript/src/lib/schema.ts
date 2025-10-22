import { z } from 'zod';
import { pluginScoreTargetsSchema } from '@code-pushup/models';
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
    .meta({
      description: `Path to a tsconfig file (default is ${DEFAULT_TS_CONFIG})`,
    }),
  onlyAudits: z
    .array(z.enum(auditSlugs))
    .meta({
      description: 'Filters TypeScript compiler errors by diagnostic codes',
    })
    .optional(),
  scoreTargets: pluginScoreTargetsSchema,
});

export type TypescriptPluginOptions = z.input<
  typeof typescriptPluginConfigSchema
>;
export type TypescriptPluginConfig = z.infer<
  typeof typescriptPluginConfigSchema
>;
