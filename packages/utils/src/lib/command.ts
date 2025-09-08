import ansis from 'ansis';
import path from 'node:path';

type ArgumentValue = number | string | boolean | string[];
export type CliArgsObject<T extends object = Record<string, ArgumentValue>> =
  T extends never
    ? Record<string, ArgumentValue | undefined> | { _: string }
    : T;

/**
 * Escapes command line arguments that contain spaces, quotes, or other special characters.
 *
 * @param {string[]} args - Array of command arguments to escape.
 * @returns {string[]} - Array of escaped arguments suitable for shell execution.
 */
export function escapeCliArgs(args: string[]): string[] {
  return args.map(arg => {
    if (arg.includes(' ') || arg.includes('"') || arg.includes("'")) {
      return `"${arg.replace(/"/g, '\\"')}"`;
    }
    return arg;
  });
}

/**
 * Formats environment variable values for display by stripping quotes and then escaping.
 *
 * @param {string} value - Environment variable value to format.
 * @returns {string} - Formatted and escaped value suitable for display.
 */
export function formatEnvValue(value: string): string {
  // Strip quotes from the value for display
  const cleanValue = value.replace(/"/g, '');
  return escapeCliArgs([cleanValue])[0] ?? cleanValue;
}

/**
 * Builds a command string by escaping arguments that contain spaces, quotes, or other special characters.
 *
 * @param {string} command - The base command to execute.
 * @param {string[]} args - Array of command arguments.
 * @returns {string} - The complete command string with properly escaped arguments.
 */
export function buildCommandString(
  command: string,
  args: string[] = [],
): string {
  if (args.length === 0) {
    return command;
  }

  return `${command} ${escapeCliArgs(args).join(' ')}`;
}

/**
 * Options for formatting a command log.
 */
export interface FormatCommandLogOptions {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
}

/**
 * Formats a command string with optional cwd prefix, environment variables, and ANSI colors.
 *
 * @param {FormatCommandLogOptions} options - Command formatting options.
 * @returns {string} - ANSI-colored formatted command string.
 */
export function formatCommandLog(options: FormatCommandLogOptions): string {
  const { command, args = [], cwd = process.cwd(), env } = options;
  const relativeDir = path.relative(process.cwd(), cwd);

  return [
    ...(relativeDir && relativeDir !== '.'
      ? [ansis.italic(ansis.gray(relativeDir))]
      : []),
    ansis.yellow('$'),
    ...(env && Object.keys(env).length > 0
      ? Object.entries(env).map(([key, value]) => {
          return ansis.gray(`${key}=${formatEnvValue(value)}`);
        })
      : []),
    ansis.gray(command),
    ansis.gray(escapeCliArgs(args).join(' ')),
  ].join(' ');
}

/**
 * Converts an object with different types of values into an array of command-line arguments.
 *
 * @example
 * const args = objectToCliArgs({
 *   _: ['node', 'index.js'], // node index.js
 *   name: 'Juanita', // --name=Juanita
 *   formats: ['json', 'md'] // --format=json --format=md
 * });
 */
export function objectToCliArgs<
  T extends object = Record<string, ArgumentValue>,
>(params?: CliArgsObject<T>): string[] {
  if (!params) {
    return [];
  }

  return Object.entries(params).flatMap(([key, value]) => {
    // process/file/script
    if (key === '_') {
      return Array.isArray(value) ? value : [`${value}`];
    }
    const prefix = key.length === 1 ? '-' : '--';
    // "-*" arguments (shorthands)
    if (Array.isArray(value)) {
      return value.map(v => `${prefix}${key}="${v}"`);
    }
    // "--*" arguments ==========

    if (typeof value === 'object') {
      return Object.entries(value as Record<string, ArgumentValue>).flatMap(
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

    throw new Error(`Unsupported type ${typeof value} for key ${key}`);
  });
}

/**
 * Converts a file path to a CLI argument by wrapping it in quotes to handle spaces.
 *
 * @param {string} filePath - The file path to convert to a CLI argument.
 * @returns {string} - The quoted file path suitable for CLI usage.
 */
export function filePathToCliArg(filePath: string): string {
  // needs to be escaped if spaces included
  return `"${filePath}"`;
}
