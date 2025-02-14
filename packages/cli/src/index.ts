#! /usr/bin/env node
import { hideBin } from 'yargs/helpers';
import { cli } from './lib/cli.js';

// bootstrap Yargs, parse arguments and execute command
await cli(hideBin(process.argv)).argv;

// we need to explicitly exit with successful code otherwise we risk hanging process in certain situations
// eslint-disable-next-line n/no-process-exit
process.exit(0);
