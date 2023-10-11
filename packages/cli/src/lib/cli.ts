import { yargsCli } from './yargs-cli';
import { options } from './options';
import { middlewares } from './middlewares';
import { commands } from './commands';

export { options } from './options';
export { middlewares } from './middlewares';
export { commands } from './commands';

export const cli = (args: string[]) =>
  yargsCli(args, {
    usageMessage: 'Code PushUp CLI',
    scriptName: 'code-pushup',
    options,
    middlewares,
    commands,
  });
