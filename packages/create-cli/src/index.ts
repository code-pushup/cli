#! /usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { CONFIG_FILE_FORMATS } from './lib/setup/types.js';
import { runSetupWizard } from './lib/setup/wizard.js';

const argv = await yargs(hideBin(process.argv))
  .option('dry-run', {
    type: 'boolean',
    default: false,
    describe: 'Preview changes without writing files',
  })
  .option('yes', {
    alias: 'y',
    type: 'boolean',
    default: false,
    describe: 'Skip prompts and use defaults',
  })
  .option('config-format', {
    type: 'string',
    choices: CONFIG_FILE_FORMATS,
    describe: 'Config file format (default: auto-detected from project)',
  })
  .parse();

// TODO: #1244 — provide plugin bindings from registry
await runSetupWizard([], argv);
