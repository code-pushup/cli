import { DEFAULT_PERSIST_FORMAT } from '@code-pushup/models';
import { executeProcess } from '@code-pushup/utils';
import type { CommandContext } from '../context.js';

type CompareOptions = {
  before: string;
  after: string;
  label?: string;
};

export async function runCompare(
  { before, after, label }: CompareOptions,
  { bin, config, directory, silent }: CommandContext,
): Promise<void> {
  const { stdout } = await executeProcess({
    command: bin,
    args: [
      'compare',
      `--before=${before}`,
      `--after=${after}`,
      ...(label ? [`--label=${label}`] : []),
      ...(config ? [`--config=${config}`] : []),
      ...DEFAULT_PERSIST_FORMAT.map(format => `--persist.format=${format}`),
    ],
    cwd: directory,
  });
  if (!silent) {
    console.info(stdout);
  }
}
