import type { Options } from 'yargs';
import type { GlobalOptions } from './global.model.js';

export function yargsGlobalOptionsDefinition(): Record<
  keyof GlobalOptions,
  Options
> {
  return {
    verbose: {
      describe:
        'When true creates more verbose output. This is helpful when debugging. You may also set CP_VERBOSE env variable instead.',
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
