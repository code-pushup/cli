import { commands } from '../src/lib/commands';
import { middlewares } from '../src/lib/middlewares';
import { options } from '../src/lib/options';

export const CORE_CONFIG_NAMES = ['minimal' as const, 'persist' as const, 'persist-only-filename' as const];
export type CoreConfigNames = typeof CORE_CONFIG_NAMES[number] ;
export const DEFAULT_CLI_CONFIGURATION = {
  usageMessage: 'Code PushUp CLI',
  scriptName: 'code-pushup',
  options,
  middlewares,
  commands,
  noExitProcess: true, // exiting process suppresses error message
};
