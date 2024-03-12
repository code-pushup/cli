// eslint-ignore-next-line import/no-named-as-default-member
import fastGlob from 'fast-glob';
import { glob } from 'glob';
import { globby } from 'globby';
import { join } from 'node:path';
import yargs from 'yargs';

const cli = yargs(process.argv).options({
  pattern: {
    type: 'array',
    string: true,
    default: [join(process.cwd(), '(packages|e2e|examples|testing|tools)/**/*.md')],
  },
  outputDir: {
    type: 'string',
  },
  logs: {
    type: 'boolean',
    default: true,
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

const fastGlobName = 'fast-glob';
const globName = 'glob';
const globbyName = 'globby';

// ==================
const suiteConfig = {
  suiteName: 'glob-matching',
  targetImplementation: 'fast-glob',
  cases: [
    // eslint-disable-next-line import/no-named-as-default-member
    [fastGlobName, callAndValidate(fastGlob.async, pattern, fastGlobName)],
    [globName, callAndValidate(glob, pattern, globName)],
    [globbyName, callAndValidate(globby, pattern, globbyName)],
  ],
  time: 20000
};
export default suiteConfig;

// ==============================================================
const logged: Record<string, boolean> = {};
function callAndValidate<T = string | string[]>(
  fn: (patterns: T) => Promise<unknown[]>,
  globPatterns: T,
  fnName: string,
) {
  return async () => {
    const result = await fn(globPatterns);
    if (result.length === 0) {
      //  throw new Error(`Result length is ${result.length}`);
    } else {
      if (!logged[fnName]) {
        // eslint-disable-next-line functional/immutable-data
        logged[fnName] = true;
        // eslint-disable-next-line no-console
        console.log(
          `${fnName} found ${result.length} files for pattern ${pattern.join(
            ', ',
          )}`,
        );
      }
    }
  };
}
