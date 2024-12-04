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
  try {
    return JSON.parse(stdout) as unknown;
  } catch (error) {
    throw new Error(
      `Error parsing output of print-config command - ${stringifyError(error)}`,
    );
  }
}
