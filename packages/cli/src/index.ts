/**
 * This file will get referenced under `main` in the `package.json` file
 * and maintains exports of logic and types.
 */
import { yargsCli } from './lib/cli';
import { yargsGlobalOptionsDefinition } from './lib/options';
import { middlewares } from './lib/middlewares';
import { commands } from './lib/commands';

export const cli = (args: string[]) =>
  yargsCli(args, {
    usageMessage: 'Code PushUp CLI',
    scriptName: 'code-pushup',
    options: yargsGlobalOptionsDefinition(),
    middlewares,
    commands,
  });
