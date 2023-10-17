import { Options } from 'yargs';
import { GeneralCliOptions } from './model';

export function yargsGlobalOptionsDefinition(): Record<
  keyof GeneralCliOptions,
  Options
> {
  return {
    interactive: {
      describe: 'When false disables interactive input prompts for options.',
      type: 'boolean',
      default: true,
    },
    verbose: {
      describe:
        'When true creates more verbose output. This is helpful when debugging.',
      type: 'boolean',
      default: false,
    },
    config: {
      describe: 'Path the the config file, e.g. code-pushup.config.js',
      type: 'string',
      default: 'code-pushup.config.js',
    },
  };
}
