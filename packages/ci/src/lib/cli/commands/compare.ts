import { DEFAULT_PERSIST_FORMAT } from '@code-pushup/models';
import { executeProcess, isVerbose } from '@code-pushup/utils';
import type { CommandContext } from '../context.js';

export async function runCompare(
  { bin, config, directory, observer }: CommandContext,
  { hasFormats }: { hasFormats: boolean },
): Promise<void> {
  await executeProcess({
    verbose: isVerbose(),
    command: bin,
    args: [
      'compare',
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
