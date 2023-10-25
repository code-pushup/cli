import { commands } from './commands';
import { middlewares } from './middlewares';
import { options } from './options';
import { yargsCli } from './yargs-cli';

export const CLI_NAME = 'Code PushUp CLI';
export const CLI_SCRIPT_NAME = 'code-pushup';

export const cli = (args: string[]) =>
  yargsCli(args, {
    usageMessage: CLI_NAME,
    scriptName: CLI_SCRIPT_NAME,
    options,
    middlewares,
    commands,
  });
