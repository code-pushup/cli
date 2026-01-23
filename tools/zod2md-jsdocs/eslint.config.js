const baseConfig = require('../../eslint.config.js').default;

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
