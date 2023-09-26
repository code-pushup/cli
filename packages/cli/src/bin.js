#! /usr/bin/env node
import { cli } from './../index.js';
import { hideBin } from 'yargs/helpers';

// bootstrap yargs; format arguments
cli(hideBin(process.argv)).argv;
