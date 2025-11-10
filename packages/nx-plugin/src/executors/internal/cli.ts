export function createCliCommandString(options?: {
  args?: Record<string, unknown>;
  command?: string;
  bin?: string;
  env?: Record<string, string>;
}): string {
  const { bin = '@code-pushup/cli', command, args, env } = options ?? {};
  const isFile = isFilePath(bin);
  const envTerminalString = Object.entries(env ?? {})
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');
  const commandPrefix = isFile ? 'node' : 'npx';
  const envPrefix = envTerminalString ? `${envTerminalString} ` : '';
  return `${envPrefix}${commandPrefix} ${bin} ${objectToCliArgs({
    _: command ?? [],
    ...args,
  }).join(' ')}`;
}

function isFilePath(bin: string): boolean {
  return (
    /\.(js|ts|mjs|cjs)$/.test(bin) ||
    bin.startsWith('./') ||
    bin.startsWith('../') ||
    (bin.includes('/') && !bin.startsWith('@'))
  );
}

export function createCliCommandObject(options?: {
  args?: Record<string, unknown>;
  command?: string;
  bin?: string;
  env?: Record<string, string>;
}): import('@code-pushup/utils').ProcessConfig {
  const { bin = '@code-pushup/cli', command, args, env } = options ?? {};
  const isFile = isFilePath(bin);
  const envTerminalString = Object.entries(env ?? {})
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');
  return {
    command: isFile ? 'node' : 'npx',
    args: [
      ...(envTerminalString ? [envTerminalString] : []),
      bin,
      ...objectToCliArgs({ _: command ?? [], ...args }),
    ],
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
