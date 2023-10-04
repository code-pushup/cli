#! /usr/bin/env node
import { cli } from './lib/cli';
import { hideBin } from 'yargs/helpers';

// bootstrap yargs; format arguments
cli(hideBin(process.argv)).argv;
