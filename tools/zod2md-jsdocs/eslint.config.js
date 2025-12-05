const baseConfig = require('../../eslint.config.js').default;

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': 'error',
    },
  },
  {
    files: ['**/*.ts', '**/*.cjs', '**/*.js'],
    rules: {
      'import/no-commonjs': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unicorn/prefer-module': 'off',
      'functional/immutable-data': 'off',
      'arrow-body-style': 'off',
    },
  },
];
