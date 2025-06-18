import { writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';

// This is adding `require("./../../../../tools/perf_hooks.patch");` to your `node_modules/nx/src/utils/perf-logging.js`.
writeFileSync(
  './node_modules/nx/src/utils/perf-logging.js',
  readFileSync(
    './node_modules/nx/src/utils/perf-logging.js',
    'utf-8',
  ).toString() + 'require("./../../../../tools/perf_hooks.patch");',
);
