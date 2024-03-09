import { commands } from './commands';
import { CLI_NAME, CLI_SCRIPT_NAME } from './constants';
import { middlewares } from './middlewares';
import { groups, options } from './options';
import { yargsCli } from './yargs-cli';

export const cli = (args: string[]) =>
  yargsCli(args, {
    usageMessage: CLI_NAME,
    scriptName: CLI_SCRIPT_NAME,
    options,
    groups,
    examples: [
      [
        'code-pushup collect --config tsconfig.test.json',
        'Use the config from `tsconfig.test.json` and only collect audits',
      ],
      [
        'code-pushup print-config --onlyPlugins',
        'print the config object but from the plugins only list given slugs',
      ],
    ],
    middlewares,
    commands,
  });
