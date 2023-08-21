const eslintPlugin = require('@quality-metrics/eslint-plugin');
// lighthouse not CommonJS compatible
// const lighthousePlugin = require('@quality-metrics/lighthouse-plugin');

module.exports = {
  plugins: [
    eslintPlugin({ config: '.eslintrc.json' }),
    // lighthousePlugin({ config: '.lighthouserc.json' }),
  ],
};
