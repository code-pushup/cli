import type { Audit, Group } from '@code-pushup/models';
import { camelCaseToKebabCase, kebabCaseToSentence } from '@code-pushup/utils';
import { TS_ERROR_CODES } from './runner/ts-error-codes.js';
import type { CompilerOptionName } from './runner/types.js';

export const TYPESCRIPT_PLUGIN_SLUG = 'typescript';
export const DEFAULT_TS_CONFIG = 'tsconfig.json';

export const AUDITS = Object.values(TS_ERROR_CODES)
  .flatMap(i => Object.entries(i))
  .reduce<Audit[]>((audits, [name]) => {
    const slug = camelCaseToKebabCase(name) as CompilerOptionName;
    const title = kebabCaseToSentence(name);
    return [
      ...audits,
      {
        slug,
        title,
        docsUrl: `https://www.typescriptlang.org/tsconfig/#${name}`,
      },
    ];
  }, []);

const GROUP_WEIGHTS: Partial<Record<keyof typeof TS_ERROR_CODES, number>> = {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  strict: 3,
  typeCheckingBehavior: 2,
  controlFlowOptions: 2,
  interopConstraints: 2,
};

const GROUPS_DESCRIPTIONS: Record<keyof typeof TS_ERROR_CODES, string> = {
  languageAndEnvironment:
    'Configuration options for TypeScript language features and runtime environment, including decorators, JSX support, target ECMAScript version, and class field behaviors',
  interopConstraints:
    'Settings that control how TypeScript interoperates with other JavaScript code, including module imports/exports and case sensitivity rules',
  moduleResolution:
    'Settings that control how TypeScript finds and resolves module imports, including Node.js resolution, package.json exports/imports, and module syntax handling',
  typeCheckingBehavior:
    'Configuration for TypeScript type checking strictness and error reporting, including property access rules and method override checking',
  controlFlowOptions:
    'Settings that affect code flow analysis, including handling of unreachable code, unused labels, switch statements, and async/generator functions',
  strict:
    'Strict type checking options that enable additional compile-time verifications, including null checks, implicit any/this, and function type checking',
  buildEmitOptions:
    'Configuration options that control TypeScript output generation, including whether to emit files, how to handle comments and declarations, and settings for output optimization and compatibility helpers',
};

export const GROUPS: Group[] = Object.entries(TS_ERROR_CODES).map(
  ([groupSlug, auditMap]) => ({
    slug: camelCaseToKebabCase(groupSlug),
    title: kebabCaseToSentence(groupSlug),
    description:
      GROUPS_DESCRIPTIONS[groupSlug as keyof typeof GROUPS_DESCRIPTIONS],
    refs: Object.keys(auditMap).map(audit => ({
      slug: camelCaseToKebabCase(audit),
      weight: GROUP_WEIGHTS[audit as keyof typeof GROUP_WEIGHTS] ?? 1,
    })),
  }),
);
