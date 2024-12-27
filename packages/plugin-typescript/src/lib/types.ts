import { z } from 'zod';
import type { CamelCaseToKebabCase } from '@code-pushup/utils';
import type { CompilerOptionName } from './runner/types.js';
import { typescriptPluginConfigSchema } from './schema.js';

export type AuditSlug = CamelCaseToKebabCase<CompilerOptionName>;

export type TypescriptPluginOptions = z.infer<
  typeof typescriptPluginConfigSchema
> & { onlyAudits?: AuditSlug[] | undefined };
