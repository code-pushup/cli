import { logger } from '@nx/devkit';
import type { ProcessConfig } from '../../internal/execute-process.js';

export function createCliCommandString(options?: {
  args?: Record<string, unknown>;
  command?: string;
  bin?: string;
}): string {
  const { bin = '@code-pushup/cli', command, args } = options ?? {};
  return `npx ${bin} ${objectToCliArgs({ _: command ?? [], ...args }).join(
    ' ',
  )}`;
}

export function createCliCommandObject(options?: {
  args?: Record<string, unknown>;
  command?: string;
  bin?: string;
}): ProcessConfig {
  const { bin = '@code-pushup/cli', command, args } = options ?? {};
  return {
    command: 'npx',
    args: [bin, ...objectToCliArgs({ _: command ?? [], ...args })],
    observer: {
      onError: error => {
        logger.error(error.message);
      },
      onStdout: data => {
        logger.log(data);
      },
    },
  };
}

type ArgumentValue = number | string | boolean | string[];
export type CliArgsObject<T extends object = Record<string, ArgumentValue>> =
  T extends never
    ? Record<string, ArgumentValue | undefined> | { _: string }
    : T;

// @TODO import from @code-pushup/utils => get rid of poppins for cjs support
export function objectToCliArgs<
  T extends object = Record<string, ArgumentValue>,
>(params?: CliArgsObject<T>): string[] {
  if (!params) {
    return [];
  }

  return Object.entries(params).flatMap(([key, value]) => {
    // process/file/script
    if (key === '_') {
      return (Array.isArray(value) ? value : [`${value}`]).filter(
        v => v != null,
      );
    }

    const prefix = key.length === 1 ? '-' : '--';
    // "-*" arguments (shorthands)
    if (Array.isArray(value)) {
      return value.map(v => `${prefix}${key}="${v}"`);
    }

    if (typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>).flatMap(
        // transform nested objects to the dot notation `key.subkey`
        ([k, v]) => objectToCliArgs({ [`${key}.${k}`]: v }),
      );
    }

    if (typeof value === 'string') {
      return [`${prefix}${key}="${value}"`];
    }

    if (typeof value === 'number') {
      return [`${prefix}${key}=${value}`];
    }

    if (typeof value === 'boolean') {
      return [`${prefix}${value ? '' : 'no-'}${key}`];
    }

    if (value === undefined) {
      return [];
    }

    throw new Error(`Unsupported type ${typeof value} for key ${key}`);
  });
}
