#! /usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { axeSetupBinding } from '@code-pushup/axe-plugin';
import { coverageSetupBinding } from '@code-pushup/coverage-plugin';
import { eslintSetupBinding } from '@code-pushup/eslint-plugin';
import { jsPackagesSetupBinding } from '@code-pushup/js-packages-plugin';
import { jsDocsSetupBinding } from '@code-pushup/jsdocs-plugin';
import { lighthouseSetupBinding } from '@code-pushup/lighthouse-plugin';
import { typescriptSetupBinding } from '@code-pushup/typescript-plugin';
import { parsePluginSlugs, validatePluginSlugs } from './lib/setup/plugins.js';
import {
  CI_PROVIDERS,
  CONFIG_FILE_FORMATS,
  type PluginSetupBinding,
  SETUP_MODES,
} from './lib/setup/types.js';
import { runSetupWizard } from './lib/setup/wizard.js';

const bindings: PluginSetupBinding[] = [
  eslintSetupBinding,
  coverageSetupBinding,
  jsPackagesSetupBinding,
  typescriptSetupBinding,
  lighthouseSetupBinding,
  axeSetupBinding,
  jsDocsSetupBinding,
];

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
    describe: 'CI/CD integration (github, gitlab, or none)',
  })
  .check(parsed => {
    validatePluginSlugs(bindings, parsed.plugins);
    return true;
  })
  .parse();

await runSetupWizard(bindings, argv);
