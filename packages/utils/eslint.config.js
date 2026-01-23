import tseslint from 'typescript-eslint';
import baseConfig from '../../eslint.config.js';

export default tseslint.config(
  ...(await (typeof baseConfig === 'function' ? baseConfig() : baseConfig)),
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
        { ignoredDependencies: ['esbuild'] }, // esbuild is a peer dependency of bundle-require
      ],
    },
  },
);
