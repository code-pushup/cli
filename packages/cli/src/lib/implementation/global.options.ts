import type { Options } from 'yargs';
import type { GeneralCliOptions } from './global.model.js';

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
      describe:
        'Path to config file. By default it loads code-pushup.config.(ts|mjs|js).',
      type: 'string',
    },
    tsconfig: {
      describe:
        'Path to a TypeScript config, to be used when loading config file.',
      type: 'string',
    },
  };
}
