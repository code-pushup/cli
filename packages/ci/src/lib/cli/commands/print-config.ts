import { executeProcess } from '@code-pushup/utils';
import type { CommandContext } from '../context';

export async function printConfig({
  bin,
  config,
  directory,
  silent,
}: CommandContext): Promise<void> {
  const { stdout } = await executeProcess({
    command: bin,
    args: [...(config ? [`--config=${config}`] : []), 'print-config'],
    cwd: directory,
  });
  if (!silent) {
    console.info(stdout);
  }
}
