export function createCliCommand(
  command: string,
  args: Record<string, unknown>,
  options?: {
    bin: string;
  },
): string {
  const { bin = '@code-pushup/cli' } = options ?? {};
  return `npx ${bin} ${command} ${objectToCliArgs(args).join(' ')}`;
}

type ArgumentValue = number | string | boolean | string[];
export type CliArgsObject<T extends object = Record<string, ArgumentValue>> =
  T extends never
    ? // eslint-disable-next-line @typescript-eslint/naming-convention
      Record<string, ArgumentValue | undefined> | { _: string }
    : T;
// @TODO import from @code-pushup/utils => get rid of poppins for cjs support
// eslint-disable-next-line sonarjs/cognitive-complexity
export function objectToCliArgs<
  T extends object = Record<string, ArgumentValue>,
>(params?: CliArgsObject<T>): string[] {
  if (!params) {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return Object.entries(params).flatMap(([key, value]) => {
    // process/file/script
    if (key === '_') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return Array.isArray(value) ? value : [`${value}`];
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
