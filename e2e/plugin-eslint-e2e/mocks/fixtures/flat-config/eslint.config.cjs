/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    ignores: ['code-pushup.config.ts'],
  },
  {
    rules: {
      eqeqeq: 'error',
      'max-lines': ['warn', 100],
      'no-unused-vars': 'warn',
    },
  },
];
