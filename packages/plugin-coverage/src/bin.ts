import process from 'node:process';
import { Parser } from 'yargs/helpers';
import { executeRunner } from './lib/runner/index.js';

const { runnerConfigPath, runnerOutputPath } = Parser(process.argv);

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
  await executeRunner({ runnerConfigPath, runnerOutputPath });
})();
