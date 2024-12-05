import { executeProcess, stringifyError } from '@code-pushup/utils';
import type { CommandContext } from '../context.js';

export async function runPrintConfig({
  bin,
  config,
  directory,
  silent,
}: CommandContext): Promise<unknown> {
  const { stdout } = await executeProcess({
    command: bin,
    args: [...(config ? [`--config=${config}`] : []), 'print-config'],
    cwd: directory,
  });
  if (!silent) {
    console.info(stdout);
  }

  // workaround for 1st lines like `> nx run utils:code-pushup -- print-config`
  const lines = stdout.split(/\r?\n/);
  const jsonLines = lines.slice(lines.indexOf('{'), lines.indexOf('}') + 1);
  const stdoutSanitized = jsonLines.join('\n');

  try {
    return JSON.parse(stdoutSanitized) as unknown;
  } catch (error) {
    if (silent) {
      console.info('Invalid output from print-config:');
      console.info(stdout);
    }
    throw new Error(
      `Error parsing output of print-config command - ${stringifyError(error)}`,
    );
  }
}
