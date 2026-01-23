import tseslint from 'typescript-eslint';
import baseConfig from '../../eslint.config.js';

const resolvedBaseConfig = await (typeof baseConfig === 'function'
  ? baseConfig()
  : baseConfig);

export default tseslint.config(
  ...resolvedBaseConfig,
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
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        { ignoredDependencies: ['type-fest'] }, // only for internal typings
      ],
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      'vitest/max-nested-describe': ['warn', { max: 3 }],
      'n/no-unsupported-features/node-builtins': 'off',
    },
  },
);
