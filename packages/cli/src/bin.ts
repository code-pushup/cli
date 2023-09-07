#! /usr/bin/env node
import { cli } from './index';
import { hideBin } from 'yargs/helpers';

// bootstrap yargs; format arguments
cli(hideBin(process.argv)).argv;
