import { Options } from 'yargs';

export function yargsGlobalOptionsDefinition(): Record<string, Options> {
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
    configPath: {
      describe: 'Path the the config file. e.g. code-pushup.config.js',
      type: 'string',
      default: 'code-pushup.config.js',
    },
  };
}
