import { z } from 'zod';
import type { AUDITS } from './constants.js';
import { typescriptPluginConfigSchema } from './schema.js';

export type AuditSlug = (typeof AUDITS)[number]['slug'];

export type TypescriptPluginOptions = z.infer<
  typeof typescriptPluginConfigSchema
> & { onlyAudits?: (string | AuditSlug)[] | undefined };
