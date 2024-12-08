import { commands } from '../src/lib/commands.js';
import { middlewares } from '../src/lib/middlewares.js';
import { options } from '../src/lib/options.js';

export const DEFAULT_CLI_CONFIGURATION = {
  usageMessage: 'Code PushUp CLI',
  scriptName: 'code-pushup',
  options,
  middlewares,
  commands,
  noExitProcess: true, // exiting process suppresses error message
};
