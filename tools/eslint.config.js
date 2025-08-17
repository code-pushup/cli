import tseslint from 'typescript-eslint';
import baseConfig from '../eslint.config.js';

export default tseslint.config(...baseConfig, {
  files: ['**/*.ts'],
  parserOptions: {
    project: ['tools/tsconfig.tools.json'],
  },
  rules: {
    '@nx/enforce-module-boundaries': 'off',
  },
});
