import * as Benchmark from 'benchmark';
import { join } from 'node:path';
import { fastGlob } from './fast-glob';
import { glob } from './glob';
import { globby } from './globby';

const suite = new Benchmark.Suite('report-scoring');

const BASE_PATH = join(
  process.cwd(),
  '..',
  '..',
  '..',
  'node_modules',
  '**/*.js',
);

// ==================

const start = performance.now();

// Add listener
const listeners = {
  cycle: function (event: Benchmark.Event) {
    console.info(String(event.target));
  },
  complete: () => {
    if (typeof suite.filter === 'function') {
      console.info(' ');
      console.info(
        `Total Duration: ${((performance.now() - start) / 1000).toFixed(
          2,
        )} sec`,
      );
      console.info(`Fastest is ${String(suite.filter('fastest').map('name'))}`);
    }
  },
};

// ==================

// Add tests
const pattern = [BASE_PATH];
suite.add('glob', wrapWithDefer(glob));
suite.add('globby', wrapWithDefer(globby));
suite.add('fastGlob', wrapWithDefer(fastGlob));

// ==================

// Add Listener
Object.entries(listeners).forEach(([name, fn]) => {
  suite.on(name, fn);
});

// ==================

console.info('You can adjust the test with the following arguments:');
console.info(`pattern      glob pattern of test      --pattern=${BASE_PATH}`);
console.info(' ');
console.info('Start benchmark...');
console.info(' ');

suite.run({
  async: true,
});

// ==============================================================

function wrapWithDefer(asyncFn: (pattern: string[]) => Promise<string[]>) {
  const logged: Record<string, boolean> = {};
  return {
    defer: true, // important for async functions
    fn: function (deferred: { resolve: () => void }) {
      return asyncFn(pattern)
        .catch(() => [])
        .then((result: unknown[]) => {
          if (result.length === 0) {
            throw new Error(`Result length is ${result.length}`);
          } else {
            if (!logged[asyncFn.name]) {
              // eslint-disable-next-line functional/immutable-data
              logged[asyncFn.name] = true;
              console.info(`${asyncFn.name} found ${result.length} files`);
            }
            deferred.resolve();
          }
          return void 0;
        });
    },
  };
}
