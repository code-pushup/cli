import tseslint from 'typescript-eslint';
import baseConfig from '../../eslint.config.js';

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
    files: ['packages/utils/src/lib/**/wal*.ts'],
    rules: {
      'n/no-sync': 'off',
    },
  },
  {
    files: ['packages/utils/src/lib/profiler/trace-file-utils.ts'],
    rules: {
      // os.availableParallelism() is checked for existence before use, with fallback to os.cpus().length
      'n/no-unsupported-features/node-builtins': 'off',
    },
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        { ignoredDependencies: ['esbuild'] }, // esbuild is a peer dependency of bundle-require
      ],
    },
  },
);
