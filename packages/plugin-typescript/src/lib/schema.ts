import { z } from 'zod';
import { AUDITS, DEFAULT_TS_CONFIG } from './constants.js';
import type { CompilerOptionName } from './types.js';

const auditSlugs = AUDITS.map(({ slug }) => slug) as [string, ...string[]];
export const typescriptPluginConfigSchema = z.object({
  tsConfigPath: z
    .string({
      description: 'Path to the TsConfig',
    })
    .default(DEFAULT_TS_CONFIG),
  onlyAudits: z
    .array(z.enum(auditSlugs), {
      description: 'Array with specific TsCodes to measure',
    })
    .optional(),
});

export type TypescriptPluginOptions = z.infer<
  typeof typescriptPluginConfigSchema
> & { onlyAudits?: (string | CompilerOptionName)[] | undefined };
