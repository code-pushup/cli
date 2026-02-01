import tseslint from 'typescript-eslint';
import baseConfig from '../../eslint.config.js';

if (process.env['CP_DEBUG_ESLINT_IMPORTS'] === 'true') {
  // eslint-disable-next-line no-console
  console.log('[CP_DEBUG] Loaded packages/nx-plugin/eslint.config.js', {
    baseConfigLength: baseConfig.length,
  });
}

export default tseslint.config(
  ...baseConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      // Nx plugins don't yet support ESM: https://github.com/nrwl/nx/issues/15682
      'unicorn/prefer-module': 'off',
      // used instead of verbatimModuleSyntax tsconfig flag (requires ESM)
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      '@typescript-eslint/consistent-type-exports': [
        'warn',
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],
      // `import path from 'node:path'` incompatible with CJS runtime, prefer `import * as path from 'node:path'`
      'unicorn/import-style': [
        'warn',
        { styles: { 'node:path': { namespace: true } } },
      ],
      // `import { logger } from '@nx/devkit' is OK here
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        { ignoredDependencies: ['typescript-eslint'] },
      ],
    },
  },
  {
    files: ['**/package.json', '**/generators.json'],
    rules: {
      '@nx/nx-plugin-checks': 'error',
    },
  },
);
