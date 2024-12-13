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
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        { ignoredDependencies: ['@code-pushup/nx-plugin'] }, // nx-plugin is run via CLI
      ],
    },
  },
);
