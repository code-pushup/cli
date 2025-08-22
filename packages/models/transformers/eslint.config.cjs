const baseConfig = require('../../../eslint.config.js').default;

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': 'error',
    },
  },
];
