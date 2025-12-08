import type { Options } from 'yargs';
import type { PrintConfigOptions } from './print-config.model.js';

export function yargsPrintConfigOptionsDefinition(): Record<
  keyof PrintConfigOptions,
  Options
> {
  return {
    output: {
      describe: 'Output file path for resolved JSON config',
      type: 'string',
      demandOption: true,
    },
  };
}
