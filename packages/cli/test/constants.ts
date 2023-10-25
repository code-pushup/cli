import { commands } from '../src/lib/commands';
import { middlewares } from '../src/lib/middlewares';
import { options } from '../src/lib/options';

export const DEFAULT_CLI_CONFIGURATION = {
  usageMessage: 'Code PushUp CLI',
  scriptName: 'code-pushup',
  options,
  middlewares,
  commands,
};
