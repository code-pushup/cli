#! /usr/bin/env node
import { hideBin } from 'yargs/helpers';
import { cli } from './lib/cli';

// bootstrap yargs; format arguments
await cli(hideBin(process.argv)).argv;
