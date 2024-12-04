import { DEFAULT_PERSIST_FORMAT } from '@code-pushup/models';
import { executeProcess } from '@code-pushup/utils';
import type { CommandContext } from '../context.js';

export async function runCollect({
  bin,
  config,
  directory,
  silent,
}: CommandContext): Promise<void> {
  const { stdout } = await executeProcess({
    command: bin,
    args: [
      ...(config ? [`--config=${config}`] : []),
      ...DEFAULT_PERSIST_FORMAT.map(format => `--persist.format=${format}`),
    ],
    cwd: directory,
  });
  if (!silent) {
    console.info(stdout);
  }
}
