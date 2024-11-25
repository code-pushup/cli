import { executeProcess } from '@code-pushup/utils';
import type { CommandContext } from '../context';
import {
  type PersistedCliFiles,
  persistCliOptions,
  persistedCliFiles,
} from '../persist';

type CompareOptions = {
  before: string;
  after: string;
  label?: string;
};

export async function runCompare(
  { before, after, label }: CompareOptions,
  { bin, config, directory, silent, project, output }: CommandContext,
): Promise<PersistedCliFiles> {
  const { stdout } = await executeProcess({
    command: bin,
    args: [
      'compare',
      `--before=${before}`,
      `--after=${after}`,
      ...(label ? [`--label=${label}`] : []),
      ...(config ? [`--config=${config}`] : []),
      ...persistCliOptions({ directory, project, output }),
    ],
    cwd: directory,
  });
  if (!silent) {
    console.info(stdout);
  }

  return persistedCliFiles({ directory, isDiff: true, project, output });
}
