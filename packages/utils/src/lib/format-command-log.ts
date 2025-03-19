import ansis from 'ansis';
import path from 'node:path';

/**
 * Formats a command string with optional cwd prefix and ANSI colors.
 *
 * @param {string} command - The command to execute.
 * @param {string[]} args - Array of command arguments.
 * @param {string} [cwd] - Optional current working directory for the command.
 * @returns {string} - ANSI-colored formatted command string.
 */
export function formatCommandLog(
  command: string,
  args: string[] = [],
  cwd: string = process.cwd(),
): string {
  const relativeDir = path.relative(process.cwd(), cwd);

  return [
    ...(relativeDir && relativeDir !== '.'
      ? [ansis.italic(ansis.gray(relativeDir))]
      : []),
    ansis.yellow('$'),
    ansis.gray(command),
    ansis.gray(args.map(arg => arg).join(' ')),
  ].join(' ');
}
