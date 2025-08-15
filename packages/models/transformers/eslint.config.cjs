const baseConfig = require('../../../eslint.config.js').default;

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': 'error',
    },
  },
  {
    files: ['**/*.ts', '**/*.js'],
    rules: {
      // Allow CommonJS in this transformer package
      'import/no-commonjs': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'unicorn/prefer-module': 'off',
      'functional/immutable-data': 'off',
    },
  },
];
