import { executeProcess } from '@code-pushup/utils';
import type { CommandContext } from '../context';
import {
  type PersistedCliFiles,
  persistCliOptions,
  persistedCliFiles,
} from '../persist';

export async function collect({
  bin,
  config,
  directory,
  silent,
  project,
}: CommandContext): Promise<PersistedCliFiles> {
  const { stdout } = await executeProcess({
    command: bin,
    args: [
      ...(config ? [`--config=${config}`] : []),
      ...persistCliOptions({ directory, project }),
    ],
    cwd: directory,
  });
  if (!silent) {
    console.info(stdout);
  }

  return persistedCliFiles({ directory, project });
}
