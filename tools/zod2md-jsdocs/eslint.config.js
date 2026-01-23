const baseConfig = require('../../eslint.config.js').default;

// eslint-disable-next-line unicorn/prefer-top-level-await, arrow-body-style
module.exports = (async () => {
  return [
    ...(await (typeof baseConfig === 'function' ? baseConfig() : baseConfig)),
    {
      files: ['**/*.json'],
      rules: {
        '@nx/dependency-checks': 'error',
      },
    },
  ];
})();
