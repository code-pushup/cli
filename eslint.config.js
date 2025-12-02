import nxEslintPlugin from '@nx/eslint-plugin';
import jestExtendedPlugin from 'eslint-plugin-jest-extended';
import jsoncParser from 'jsonc-eslint-parser';
import fs from 'node:fs';
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
            String.raw`^[./]+/(testing/)?test-setup-config/src/index\.js$`,
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
    plugins: { 'jest-extended': jestExtendedPlugin },
    rules: {
      'vitest/consistent-test-filename': [
        'warn',
        {
          pattern: String.raw`.*\.(bench|type|unit|int|e2e)\.test\.[tj]sx?$`,
        },
      ],
      'jest-extended/prefer-to-be-array': 'warn',
      'jest-extended/prefer-to-be-false': 'warn',
      'jest-extended/prefer-to-be-object': 'warn',
      'jest-extended/prefer-to-be-true': 'warn',
      'jest-extended/prefer-to-have-been-called-once': 'warn',
    },
  },
  {
    files: ['**/*.type.test.ts'],
    rules: {
      'vitest/expect-expect': 'off',
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
      'unicorn/number-literal-case': 'off',
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
    // tests need only be compatible with local Node version
    // publishable packages should pick up version range from "engines" in their package.json
    files: ['e2e/**/*.ts', 'testing/**/*.ts', '**/*.test.ts'],
    settings: {
      node: {
        version: fs.readFileSync('.node-version', 'utf8'),
      },
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
