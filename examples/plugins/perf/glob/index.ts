import { async as fastGlob } from 'fast-glob';
import { glob } from 'glob';
import { globby } from 'globby';
import { join } from 'node:path';
import yargs from 'yargs';
import { SuiteConfig } from '../../src/benchmark-js/src/suit-helper';

const cli = yargs(process.argv).options({
  pattern: {
    type: 'array',
    default: [join(process.cwd(), '**/*.ts')],
  },
  logs: {
    type: 'boolean',
    default: false,
  },
});

// eslint-disable-next-line n/no-sync
const { pattern, logs } = cli.parseSync();

if (logs) {
  // eslint-disable-next-line no-console
  console.log('You can adjust the test with the following arguments:');
  // eslint-disable-next-line no-console
  console.log(
    `pattern      glob pattern of test      --pattern=${pattern.toString()}`,
  );
}
// ==================
const suitConfig: SuiteConfig = {
  suitName: 'glob',
  targetImplementation: 'fast-glob',
  cases: [
     
    ['fast-glob', wrapWithDefer(fastGlob.async)],
    ['glob', wrapWithDefer(glob)],
    ['globby', wrapWithDefer(globby)],
  ],
};
export default suitConfig;

// ==============================================================

function wrapWithDefer(asyncFn: (pattern: string[]) => Promise<string[]>) {
  const logged: Record<string, boolean> = {};
  return {
    defer: true, // important for async functions
    fn: function (deferred: { resolve: () => void }) {
      return asyncFn([pattern.toString()])
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
