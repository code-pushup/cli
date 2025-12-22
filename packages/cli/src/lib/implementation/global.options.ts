import type { Options } from 'yargs';
import type { GlobalOptions } from './global.model.js';

export function yargsGlobalOptionsDefinition(): Record<
  keyof GlobalOptions,
  Options
> {
  return {
    verbose: {
      describe:
        'Toggles whether to print debug logs. The default value is derived from the CP_VERBOSE environment variable (false if not set).',
      type: 'boolean',
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
