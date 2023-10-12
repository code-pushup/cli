#! /usr/bin/env node
import { hideBin } from 'yargs/helpers';
import { cli } from './lib/cli';

// bootstrap yargs; format arguments
cli(hideBin(process.argv)).argv;
