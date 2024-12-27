import { z } from 'zod';
import { TS_ERROR_CODES } from './runner/ts-error-codes.js';
import { typescriptPluginConfigSchema } from './schema.js';

export type SemVerString = `${number}.${number}.${number}`;

type ErrorCodes = typeof TS_ERROR_CODES;
export type AuditSlug = {
  [K in keyof ErrorCodes]: keyof ErrorCodes[K];
}[keyof ErrorCodes];

export type TypescriptPluginOptions = z.infer<
  typeof typescriptPluginConfigSchema
> & { onlyAudits?: (string | AuditSlug)[] | undefined };
