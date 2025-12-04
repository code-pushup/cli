import ansis from 'ansis';
import path from 'node:path';

/**
 * Formats a command string for display with status indicator.
 *
 * @param bin Command string with arguments.
 * @param options Command options (cwd, env).
 * @param status Command status ('pending' | 'success' | 'failure').
 * @returns Formatted command string with colored status indicator.
 */
export function formatCommandStatus(
  bin: string,
  options?: {
    env?: Record<string, string | number | boolean>;
    cwd?: string;
  },
  status: 'pending' | 'success' | 'failure' = 'pending',
): string {
  const cwd = options?.cwd && path.relative(process.cwd(), options.cwd);
  const cwdPrefix = cwd ? ansis.blue(cwd) : '';
  const envString =
    options?.env && Object.keys(options.env).length > 0
      ? Object.entries(options.env).map(([key, value]) =>
          ansis.gray(`${key}="${value}"`),
        )
      : [];
  const statusColor =
    status === 'pending'
      ? ansis.blue('$')
      : status === 'success'
        ? ansis.green('$')
        : ansis.red('$');

  return [
    ...(cwdPrefix ? [cwdPrefix] : []),
    statusColor,
    ...envString,
    bin,
  ].join(' ');
}
