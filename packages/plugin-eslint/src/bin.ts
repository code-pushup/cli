import process from 'node:process';
import { Parser } from 'yargs/helpers';
import { executeRunner } from './lib/runner/index.js';

const { runnerConfigPath, runnerOutputPath, cwd } = Parser(process.argv);

await executeRunner({ runnerConfigPath, runnerOutputPath }, { cwd });
