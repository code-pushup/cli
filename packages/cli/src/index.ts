import { yargsCli } from './lib/cli';
import { yargsGlobalOptionsDefinition } from './lib/options';
import { middlewares } from './lib/middlewares';
import { commands } from './lib/commands';

export const cli = (args: string[]) =>
  yargsCli(
    // hide first 2 args from process
    args,
    {
      usageMessage: 'CPU CLI',
      scriptName: 'cpu',
      options: yargsGlobalOptionsDefinition(),
      middlewares,
      commands,
    },
  );
