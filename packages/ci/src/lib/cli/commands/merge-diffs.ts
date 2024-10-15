import { executeProcess } from '@code-pushup/utils';
import type { CommandContext } from '../context';
import {
  type PersistedCliFiles,
  persistCliOptions,
  persistedCliFiles,
} from '../persist';

export async function runMergeDiffs(
  files: string[],
  { bin, config, directory, silent }: CommandContext,
): Promise<PersistedCliFiles<'md'>> {
  const { stdout } = await executeProcess({
    command: bin,
    args: [
      'merge-diffs',
      ...files.map(file => `--files=${file}`),
      ...(config ? [`--config=${config}`] : []),
      ...persistCliOptions({ directory }),
    ],
    cwd: directory,
  });
  if (!silent) {
    console.info(stdout);
  }

  return persistedCliFiles({ directory, isDiff: true, formats: ['md'] });
}
