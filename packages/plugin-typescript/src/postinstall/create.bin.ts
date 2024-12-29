import path from 'node:path';
import { TS_CONFIG_DIR } from '../lib/runner/constants.js';
import { generateDefaultTsConfig } from './utils.js';

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
  await generateDefaultTsConfig({
    cacheDir: path.join('node_modules', TS_CONFIG_DIR),
  });
})();
