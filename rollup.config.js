/**
 * @param {import('rollup').RollupOptions} config
 * @param {import('@nx/rollup').RollupExecutorOptions} options
 * @returns {import('rollup').RollupOptions}
 */
function rollupConfigFactory(config, options) {
  if (config.output && !Array.isArray(config.output)) {
    if (config.output.format === 'cjs') {
      config.output.entryFileNames = '[name].cjs';
      config.output.chunkFileNames = '[name].cjs';
    } else if (config.output.format === 'esm') {
      config.output.entryFileNames = '[name].mjs';
      config.output.chunkFileNames = '[name].mjs';
    }
  }
  return config;
}

module.exports = rollupConfigFactory;
