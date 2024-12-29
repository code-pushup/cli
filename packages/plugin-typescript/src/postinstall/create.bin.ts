import path from 'node:path';
import process from 'node:process';
import { TS_CONFIG_DIR } from '../lib/runner/constants.js';
import {
  TS_CONFIG_DIR_NODE_MODULES,
  generateDefaultTsConfig,
} from './utils.js';

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
  // const isExecutedByNpmPostinstall = process.env['npm_lifecycle_event'] === 'postinstall';
  await generateDefaultTsConfig({
    cacheDir: path.join('node_modules', TS_CONFIG_DIR),
  });
})();
