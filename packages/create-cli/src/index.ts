#! /usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
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
  .parse();

// TODO: #1244 — provide plugin bindings from registry
await runSetupWizard([], argv);
