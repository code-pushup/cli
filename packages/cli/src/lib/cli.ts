import { commands } from './commands';
import { middlewares } from './middlewares';
import { options } from './options';
import { yargsCli } from './yargs-cli';

export const cli = (args: string[]) =>
  yargsCli(args, {
    usageMessage: 'Code PushUp CLI',
    scriptName: 'code-pushup',
    options,
    middlewares,
    commands,
  });
