import { DEFAULT_PERSIST_FORMAT } from '@code-pushup/models';
import { executeProcess, isVerbose } from '@code-pushup/utils';
import type { CommandContext } from '../context.js';

type CompareOptions = {
  before: string;
  after: string;
  label?: string;
};

export async function runCompare(
  { before, after, label }: CompareOptions,
  { bin, config, directory, observer }: CommandContext,
): Promise<void> {
  await executeProcess({
    command: bin,
    args: [
      'compare',
      ...(isVerbose() ? ['--verbose'] : []),
      `--before=${before}`,
      `--after=${after}`,
      ...(label ? [`--label=${label}`] : []),
      ...(config ? [`--config=${config}`] : []),
      ...DEFAULT_PERSIST_FORMAT.map(format => `--persist.format=${format}`),
    ],
    cwd: directory,
    observer,
  });
}
