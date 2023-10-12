import { Options } from 'yargs';
import { TerminalArgsObj } from './model';

export function yargsCoreConfigOptionsDefinition(): Record<
  keyof TerminalArgsObj,
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
  } as unknown as Record<keyof TerminalArgsObj, Options>;
}
