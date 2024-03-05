import chalk from 'chalk';
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
    default: join(process.cwd(), 'packages', 'utils'),
  },
  pattern: {
    type: 'string',
    default: '.md',
  },
  logs: {
    type: 'boolean',
    default: false,
  },
  outputDir: {
    type: 'string',
    default: '.code-pushup',
  },
});
const { directory, pattern, logs } = await cli.parseAsync();

if (logs) {
  console.info(
    'You can adjust the test with the following arguments:' +
      `directory      target directory of test      --directory=${directory}` +
      `pattern        pattern to search             --pattern=${pattern}`,
  );
}

const targetImplementation = '@code-pushup/utils#crawlFileSystem';
const fsWalkName = 'nodelib.fsWalk';

const suiteConfig = {
  suiteName: 'crawl-file-system',
  targetImplementation: fsWalkName,
  cases: [
    [
      targetImplementation,
      callAndValidate(
        crawlFileSystem,
        { directory, pattern },
        targetImplementation,
      ),
    ],
    [
      fsWalkName,
      callAndValidate(
        crawlFileSystemFsWalk,
        { directory, pattern },
        fsWalkName,
      ),
    ],
  ],
};
export default suiteConfig;

// ==============================================================

const logged: Record<string, boolean> = {};
function callAndValidate<T = CrawlFileSystemOptions<string>>(
  fn: (arg: T) => Promise<unknown[]>,
  options: T,
  fnName: string,
) {
  return async () => {
    const result = await fn(options);
    if (result.length === 0) {
      throw new Error(`Result length is ${result.length}`);
    } else {
      if (!logged[fnName]) {
        // eslint-disable-next-line functional/immutable-data
        logged[fnName] = true;
        // eslint-disable-next-line no-console
        console.log(
          `${chalk.bold(fnName)} found ${chalk.bold(
            result.length,
          )} files for pattern ${chalk.bold(options.pattern)}`,
        );
      }
    }
  };
}
