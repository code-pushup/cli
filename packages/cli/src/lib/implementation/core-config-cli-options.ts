import { Options } from 'yargs';
import { BaseOptions } from '@code-pushup/core';

export function yargsCoreConfigOptionsDefinition(): Record<
  keyof BaseOptions,
  Options
> {
  return {
    format: {
      describe: 'Format of the report output. e.g. `md`, `json`, `stdout`',
      type: 'array',
    },
  } as unknown as Record<keyof BaseOptions, Options>;
}
