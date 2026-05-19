import yargs, { type Argv } from 'yargs';
import { parsePluginSlugs, validatePluginSlugs } from './plugins.js';
import {
  CI_PROVIDERS,
  CONFIG_FILE_FORMATS,
  type PluginSetupBinding,
  SETUP_MODES,
} from './types.js';

export function yargsCli(bindings: PluginSetupBinding[]): Argv {
  return yargs()
    .scriptName('create-cli')
    .usage('$0 [options]')
    .parserConfiguration({ 'dot-notation': false })
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
      describe:
        'Comma-separated plugin slugs to include (e.g. eslint,coverage)',
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
    .help()
    .version();
}
