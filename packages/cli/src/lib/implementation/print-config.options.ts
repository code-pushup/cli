import type { Options } from 'yargs';
import type { PrintConfigOptions } from './print-config.model.js';

export function yargsPrintConfigOptionsDefinition(): Record<
  keyof PrintConfigOptions,
  Options
> {
  return {
    output: {
      describe: 'Output file path to use instead of stdout',
      type: 'string',
    },
  };
}
