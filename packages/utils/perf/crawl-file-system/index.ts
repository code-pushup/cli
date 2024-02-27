import { join } from 'node:path';
import yargs from 'yargs';
import {
  type CrawlFileSystemOptions,
  crawlFileSystem,
} from '../../src/lib/file-system';
import { crawlFileSystemFsWalk } from './fs-walk';

const cli = yargs(process.argv).options({
  directory: {
    type: 'string',
    default: join(process.cwd(), '..', '..', '..', 'node_modules'),
  },
  pattern: {
    type: 'string',
    default: '.json$',
  },
  verbose: {
    type: 'boolean',
    default: false,
  },
  outputDir: {
    type: 'string',
    default: '.code-pushup',
  },
});
const { directory, pattern, verbose } = cli.parseSync();

verbose &&
  console.info(
    'You can adjust the test with the following arguments:' +
      `directory      target directory of test      --directory=${directory}` +
      `pattern        pattern to search             --pattern=${pattern}`,
  );

export default {
  suitName: 'crawl-file-system',
  cases: [
    ['@code-pushup/utils#crawlFileSystem', wrapWithDefer(crawlFileSystem)],
    ['nodelib.fsWalk', wrapWithDefer(crawlFileSystemFsWalk)],
  ],
};

// ==============================================================

function wrapWithDefer<T>(
  asyncFn: (options: CrawlFileSystemOptions<T>) => Promise<unknown[]>,
) {
  return {
    defer: true, // important for async functions
    fn: function (deferred: { resolve: () => void }) {
      return asyncFn({ directory, pattern })
        .catch(() => [])
        .then((result: unknown[]) => {
          // custom validation based on the case result
          if (result.length === 0) {
            throw new Error(
              `Result length is ${result.length}. If the test result returns 0 hits the logic or configuration might be wrong.`,
            );
          } else {
            deferred.resolve();
          }
          return void 0;
        });
    },
  };
}
