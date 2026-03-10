#! /usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { parsePluginSlugs, validatePluginSlugs } from './lib/setup/plugins.js';
import {
  CI_PROVIDERS,
  CONFIG_FILE_FORMATS,
  type PluginSetupBinding,
  SETUP_MODES,
} from './lib/setup/types.js';
import { runSetupWizard } from './lib/setup/wizard.js';

// TODO: create, import and pass plugin bindings (eslint, coverage, lighthouse, typescript, js-packages, jsdocs, axe)
const bindings: PluginSetupBinding[] = [];

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
  .option('plugins', {
    type: 'string',
    describe: 'Comma-separated plugin slugs to include (e.g. eslint,coverage)',
    coerce: parsePluginSlugs,
  })
  .option('mode', {
    type: 'string',
    choices: SETUP_MODES,
    describe: 'Setup mode (default: auto-detected from project)',
  })
  .option('ci', {
    type: 'string',
    choices: CI_PROVIDERS,
    describe: 'CI/CD integration (github, gitlab, or skip)',
  })
  .check(parsed => {
    validatePluginSlugs(bindings, parsed.plugins);
    return true;
  })
  .parse();

await runSetupWizard(bindings, argv);
