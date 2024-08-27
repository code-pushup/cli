import * as Benchmark from 'benchmark';
import { join } from 'node:path';
import {
  type CrawlFileSystemOptions,
  crawlFileSystem,
} from '../../src/lib/file-system';
import { crawlFileSystemFsWalk } from './fs-walk';

const PROCESS_ARGUMENT_TARGET_DIRECTORY =
  process.argv
    .find(arg => arg.startsWith('--directory'))
    ?.split('=')
    .at(-1) ?? '';
const PROCESS_ARGUMENT_PATTERN =
  process.argv
    .find(arg => arg.startsWith('--pattern'))
    ?.split('=')
    .at(-1) ?? '';

const suite = new Benchmark.Suite('report-scoring');

const TARGET_DIRECTORY =
  PROCESS_ARGUMENT_TARGET_DIRECTORY ||
  join(process.cwd(), '..', '..', '..', 'node_modules');
const PATTERN = PROCESS_ARGUMENT_PATTERN || /.json$/;

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
const options = {
  directory: TARGET_DIRECTORY,
  pattern: PATTERN,
};
suite.add('Base', wrapWithDefer(crawlFileSystem));
suite.add('nodelib.fsWalk', wrapWithDefer(crawlFileSystemFsWalk));

// ==================

// Add Listener
Object.entries(listeners).forEach(([name, fn]) => {
  suite.on(name, fn);
});

// ==================

console.info('You can adjust the test with the following arguments:');
console.info(
  `directory      target directory of test      --directory=${TARGET_DIRECTORY}`,
);
console.info(
  `pattern        pattern to search             --pattern=${PATTERN}`,
);
console.info(' ');
console.info('Start benchmark...');
console.info(' ');

suite.run({
  async: true,
});

// ==============================================================

function wrapWithDefer<T>(
  asyncFn: (options: CrawlFileSystemOptions<T>) => Promise<unknown[]>,
) {
  return {
    defer: true, // important for async functions
    fn: function (deferred: { resolve: () => void }) {
      return asyncFn(options)
        .catch(() => [])
        .then((result: unknown[]) => {
          if (result.length === 0) {
            throw new Error(`Result length is ${result.length}`);
          } else {
            deferred.resolve();
          }
          return void 0;
        });
    },
  };
}
