import { Options } from 'yargs';
import { ArgsCliObj } from './model';

export function yargsCoreConfigOptionsDefinition(): Record<
  keyof ArgsCliObj,
  Options
> {
  return {
    format: {
      describe: 'Format of the report output. e.g. `md`, `json`, `stdout`',
      type: 'array',
    },
    apiKey: {
      describe: 'apiKey for the portal',
      type: 'string',
    },
  } as unknown as Record<keyof ArgsCliObj, Options>;
}
