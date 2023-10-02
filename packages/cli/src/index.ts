import { yargsCli } from './lib/cli';
import { options } from './lib/options';
import { middlewares } from './lib/middlewares';
import { commands } from './lib/commands';

export { options } from './lib/options';
export { middlewares } from './lib/middlewares';
export { commands } from './lib/commands';

export const cli = (args: string[]) =>
  yargsCli(args, {
    usageMessage: 'Code PushUp CLI',
    scriptName: 'code-pushup',
    options,
    middlewares,
    commands,
  });
