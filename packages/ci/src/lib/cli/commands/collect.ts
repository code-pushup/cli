import { DEFAULT_PERSIST_FORMAT } from '@code-pushup/models';
import { executeProcess, isVerbose } from '@code-pushup/utils';
import type { CommandContext } from '../context.js';

export async function runCollect({
  bin,
  config,
  directory,
  observer,
}: CommandContext): Promise<void> {
  await executeProcess({
    command: bin,
    args: [
      ...(isVerbose() ? ['--verbose'] : []),
      '--no-progress',
      ...(config ? [`--config=${config}`] : []),
      ...DEFAULT_PERSIST_FORMAT.map(format => `--persist.format=${format}`),
    ],
    cwd: directory,
    observer,
  });
}
