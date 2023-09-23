#! /usr/bin/env node

/**
 * This file will get referenced under `bin` in the `package.json` file and when loaded immediately executes the CLI.
 * For exports of logic and types please use the `index` entry point.
 */
import { cli } from './index';
import { hideBin } from 'yargs/helpers';

// bootstrap yargs; format arguments
cli(hideBin(process.argv)).argv;
