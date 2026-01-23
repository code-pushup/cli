const baseConfig = require('../../eslint.config.js').default;

module.exports = (async () => {
  const resolvedBaseConfig = await (typeof baseConfig === 'function'
    ? baseConfig()
    : baseConfig);

  return [
    ...resolvedBaseConfig,
    {
      files: ['**/*.json'],
      rules: {
        '@nx/dependency-checks': 'error',
      },
    },
  ];
})();
