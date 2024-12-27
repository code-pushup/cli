import {z} from 'zod';
import {TS_ERROR_CODES} from './runner/ts-error-codes.js';
import {typescriptPluginConfigSchema} from './schema.js';

type CamelCaseToKebabCase<S extends string> = S extends `${infer First}${infer Rest}`
  ? Rest extends Uncapitalize<Rest>
    ? `${Lowercase<First>}${CamelCaseToKebabCase<Rest>}`
    : `${Lowercase<First>}-${CamelCaseToKebabCase<Rest>}`
  : S;

export type SemVerString = `${number}.${number}.${number}`;

type ErrorCodes = typeof TS_ERROR_CODES;

export type CompilerOptionName = {
  [K in keyof ErrorCodes]: keyof ErrorCodes[K];
}[keyof ErrorCodes];

export type AuditSlug = CamelCaseToKebabCase<CompilerOptionName>;


export type TypescriptPluginOptions = z.infer<
  typeof typescriptPluginConfigSchema
> & { onlyAudits?: (string | AuditSlug)[] | undefined };
