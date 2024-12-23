import path from 'node:path';
import { type Audit, DEFAULT_PERSIST_OUTPUT_DIR } from '@code-pushup/models';
import type { AuditSlug } from './typescript-plugin.js';

export const TYPESCRIPT_PLUGIN_SLUG = 'typescript';
export const TYPESCRIPT_OUTPUT_PATH = path.join(
  DEFAULT_PERSIST_OUTPUT_DIR,
  TYPESCRIPT_PLUGIN_SLUG,
);

export const audits: Audit[] = [
  {
    slug: 'strict',
    title: 'Strict',
    description: 'Strict type checks',
  },
  {
    slug: 'noimplicitany',
    title: 'No implicit any',
    description: 'No implicit any',
  },
  {
    slug: 'checkjs',
    title: 'Check js',
    description: 'Check js',
  },
  {
    slug: 'nounusedlocals',
    title: 'Unused locals',
    description: 'Unused locals',
  },
  {
    slug: 'skiplibcheck',
    title: 'Skip-lib check',
    description: 'Skip-lib check',
  },
  {
    slug: 'strictfunctiontypes',
    title: 'Strict function types',
    description: 'Strict function types',
  },
  {
    slug: 'strictpropertyinitialization',
    title: 'Strict property initialization',
    description: 'Strict property initialization',
  },
  {
    slug: 'strictnullchecks',
    title: 'Strict null checks',
    description: 'Strict null checks',
  },
] as const;

export const errorCodeToCompilerOption = {
  // Strict Mode Options
  2322: 'strictNullChecks',
  2345: 'strictFunctionTypes',
  7006: 'noImplicitAny',
  7027: 'strictPropertyInitialization',

  // Unused Code Checks
  6133: 'noUnusedParameters',
  6196: 'noUnusedLocals',

  /*
  // File Inclusion Options
  6053: 'include, files',
  6059: 'include, files',
  18002: 'include, exclude',
  */
  /*
  // Project Settings
  5042: 'composite',
  5023: 'incremental',
  5055: 'rootDir',
  5009: 'outDir',
  */
  /*
// Module Resolution
2307: 'moduleResolution',
2820: 'baseUrl',
2821: 'paths',
*/
  /*
// Compiler Options
1375: 'esModuleInterop',
1084: 'allowSyntheticDefaultImports',
1323: 'downlevelIteration',
1206: 'target',
1371: 'resolveJsonModule',
*/

  // New Additions from Observations
  18003: 'strict',
  7053: 'skipLibCheck',
  // 1372: 'isolatedModules',
  // 6054: 'typeRoots',
  // 2792: 'allowJs',
  2720: 'checkJs',
  // 2742: 'jsx',
  // 1324: 'module',
  // 1475: 'lib'
} as const;
