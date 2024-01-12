import { commands } from './commands';
import { CLI_NAME, CLI_SCRIPT_NAME } from './constants';
import { middlewares } from './middlewares';
import { options } from './options';
import { yargsCli } from './yargs-cli';

export const cli = (args: string[]) =>
  yargsCli(args, {
    usageMessage: CLI_NAME,
    scriptName: CLI_SCRIPT_NAME,
    options,
    middlewares,
    commands,
  });
