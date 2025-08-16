import path from 'node:path';
import process from 'node:process';
import { Parser } from 'yargs/helpers';
import { ESLINT_PLUGIN_SLUG } from './lib/constants.js';
import { executeRunner } from './lib/runner/index.js';

const { runnerConfigPath, runnerOutputPath, outputDir } = Parser(process.argv);

await executeRunner({
  runnerConfigPath,
  runnerOutputPath,
  persistOutputDir: path.join(outputDir, ESLINT_PLUGIN_SLUG),
});
