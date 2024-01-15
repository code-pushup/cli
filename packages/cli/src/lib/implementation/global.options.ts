import { Options } from 'yargs';
import { GeneralCliOptions } from './global.model';

export function yargsGlobalOptionsDefinition(): Record<
  keyof GeneralCliOptions,
  Options
> {
  return {
    progress: {
      describe: 'Show progress bar in stdout.',
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
