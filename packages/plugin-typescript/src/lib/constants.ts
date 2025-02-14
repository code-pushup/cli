import type { Audit, Group } from '@code-pushup/models';
import { toSentenceCase } from '@code-pushup/utils';
import { TS_CODE_RANGE_NAMES } from './runner/ts-error-codes.js';
import type { AuditSlug } from './types.js';

export const TYPESCRIPT_PLUGIN_SLUG = 'typescript';
export const DEFAULT_TS_CONFIG = 'tsconfig.json';

const AUDIT_DESCRIPTIONS: Record<AuditSlug, string> = {
  'semantic-errors':
    'Errors that occur during type checking and type inference',
  'syntax-errors':
    'Errors that occur during parsing and lexing of TypeScript source code',
  'configuration-errors':
    'Errors that occur when parsing TypeScript configuration files',
  'declaration-and-language-service-errors':
    'Errors that occur during TypeScript language service operations',
  'internal-errors': 'Errors that occur during TypeScript internal operations',
  'no-implicit-any-errors': 'Errors related to no implicit any compiler option',
  'unknown-codes': 'Errors that do not match any known TypeScript error code',
};
export const AUDITS: (Audit & { slug: AuditSlug })[] = Object.values(
  TS_CODE_RANGE_NAMES,
).map(slug => ({
  slug,
  title: toSentenceCase(slug),
  description: AUDIT_DESCRIPTIONS[slug],
}));

/**
 * # Diagnostic Code Categories
 * | 🏷️ Category       | Diagnostic Code Ranges | Audits                                                                   |
 * |-------------------|------------------------|--------------------------------------------------------------------------|
 * | **Problems**      | 1XXX, 2XXX, 5XXX, 7XXX | `syntax-errors`, `semantic-errors`, `internal-errors`, `no-implicit-any` |
 * | **Suggestions**   | 3XXX                   | `suggestions`                                                            |
 * | **Configuration** | 6XXX                   | `configuration-errors`                                                   |
 */
export const GROUPS: Group[] = [
  {
    slug: 'problems',
    title: 'Problems',
    description:
      'Syntax, semantic, and internal compiler errors are critical for identifying and preventing bugs.',
    refs: (
      [
        'syntax-errors',
        'semantic-errors',
        'internal-errors',
        'no-implicit-any-errors',
      ] satisfies AuditSlug[]
    ).map(slug => ({
      slug,
      weight: 1,
    })),
  },
  {
    slug: 'ts-configuration',
    title: 'Configuration',
    description:
      'TypeScript configuration and options errors ensure correct project setup, reducing risks from misconfiguration.',
    refs: (['configuration-errors'] satisfies AuditSlug[]).map(slug => ({
      slug,
      weight: 1,
    })),
  },
  {
    slug: 'miscellaneous',
    title: 'Miscellaneous',
    description:
      'Errors that do not bring any specific value to the developer, but are still useful to know.',
    refs: (
      [
        'unknown-codes',
        'declaration-and-language-service-errors',
      ] satisfies AuditSlug[]
    ).map(slug => ({
      slug,
      weight: 1,
    })),
  },
];
