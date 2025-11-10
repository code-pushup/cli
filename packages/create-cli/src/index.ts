#! /usr/bin/env node
import { initCodePushup } from './lib/init.js';

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
  await initCodePushup();
})();
