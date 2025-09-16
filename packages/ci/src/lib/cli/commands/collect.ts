import { DEFAULT_PERSIST_FORMAT } from '@code-pushup/models';
import { executeProcess, isVerbose } from '@code-pushup/utils';
import type { CommandContext } from '../context.js';

export async function runCollect(
  { bin, config, directory, observer }: CommandContext,
  { hasFormats }: { hasFormats: boolean },
): Promise<void> {
  await executeProcess({
    verbose: isVerbose(),
    command: bin,
    args: [
      ...(isVerbose() ? ['--verbose'] : []),
      ...(config ? [`--config=${config}`] : []),
      ...(hasFormats
        ? []
        : DEFAULT_PERSIST_FORMAT.map(format => `--persist.format=${format}`)),
    ],
    cwd: directory,
    observer,
  });
}
