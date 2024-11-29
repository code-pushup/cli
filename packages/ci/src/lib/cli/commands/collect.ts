import { executeProcess } from '@code-pushup/utils';
import type { CommandContext } from '../context.js';
import {
  type PersistedCliFiles,
  persistCliOptions,
  persistedCliFiles,
} from '../persist.js';

export async function runCollect({
  bin,
  config,
  directory,
  silent,
  project,
  output,
}: CommandContext): Promise<PersistedCliFiles> {
  const { stdout } = await executeProcess({
    command: bin,
    args: [
      ...(config ? [`--config=${config}`] : []),
      ...persistCliOptions({ directory, project, output }),
    ],
    cwd: directory,
  });
  if (!silent) {
    console.info(stdout);
  }

  return persistedCliFiles({ directory, project, output });
}
