const tseslint = require('typescript-eslint');
const baseConfig = require('../../eslint.config.js').default;

module.exports = tseslint.config(
  ...baseConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      // Nx plugins don't yet support ESM: https://github.com/nrwl/nx/issues/15682
      'unicorn/prefer-module': 'off',
      'n/file-extension-in-import': 'off',
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
    },
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': 'error',
    },
  },
  {
    files: ['**/package.json', '**/generators.json'],
    rules: {
      '@nx/nx-plugin-checks': 'error',
    },
  },
);
