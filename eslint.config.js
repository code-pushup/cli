import nxEslintPlugin from '@nx/eslint-plugin';
import jsoncParser from 'jsonc-eslint-parser';
import tseslint from 'typescript-eslint';
import node from '@code-pushup/eslint-config/node.js';
import typescript from '@code-pushup/eslint-config/typescript.js';
import vitest from '@code-pushup/eslint-config/vitest.js';

export default tseslint.config(
  ...typescript,
  ...node,
  ...vitest,
  {
    settings: {
      'import/resolver': { typescript: { project: 'tsconfig.base.json' } },
    },
  },
  { plugins: { '@nx': nxEslintPlugin } },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [
            String.raw`^.*/eslint(\.base)?\.config\.[cm]?js$`,
            String.raw`^.*/code-pushup\.(config|preset)(\.m?[jt]s)?$`,
            '^[./]+/tools/.*$',
          ],
          depConstraints: [
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              sourceTag: 'scope:core',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:shared'],
            },
            {
              sourceTag: 'scope:plugin',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              sourceTag: 'scope:tooling',
              onlyDependOnLibsWithTags: ['scope:tooling', 'scope:shared'],
            },
            {
              sourceTag: 'type:e2e',
              onlyDependOnLibsWithTags: [
                'type:app',
                'type:feature',
                'type:util',
                'type:testing',
              ],
            },
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:util',
                'type:testing',
              ],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:util',
                'type:testing',
              ],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util', 'type:testing'],
            },
            {
              sourceTag: 'type:testing',
              onlyDependOnLibsWithTags: ['type:util', 'type:testing'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'vitest/consistent-test-filename': [
        'warn',
        { pattern: String.raw`.*\.(unit|integration|e2e)\.test\.[tj]sx?$` },
      ],
    },
  },
  {
    files: ['**/*.json'],
    languageOptions: { parser: jsoncParser },
  },
  {
    files: ['**/*.ts', '**/*.js'],
    rules: {
      'n/file-extension-in-import': ['error', 'always'],
    },
  },
  {
    files: ['**/perf/**/*.ts'],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      'sonarjs/no-duplicate-string': 'off',
    },
  },
  {
    ignores: [
      '**/*.mock.*',
      '**/code-pushup.config.ts',
      '**/mocks/fixtures/**',
      '**/__snapshots__/**',
      '**/dist',
      '**/*.md',
    ],
  },
);
