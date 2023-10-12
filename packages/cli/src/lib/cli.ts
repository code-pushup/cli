import { commands } from './commands';
import { middlewares } from './middlewares';
import { options } from './options';
import { yargsCli } from './yargs-cli';

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
