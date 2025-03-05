import type { ProcessObserver } from '@code-pushup/utils';
import { createExecutionObserver } from '../create-execution-observer.js';
import type { Settings } from '../models.js';
import type { ProjectConfig } from '../monorepo/index.js';

export type CommandContext = Pick<Settings, 'bin' | 'config' | 'directory'> & {
  observer?: ProcessObserver;
};

export function createCommandContext(
  { config, bin, directory, silent }: Settings,
  project: ProjectConfig | null | undefined,
): CommandContext {
  return {
    bin: project?.bin ?? bin,
    directory: project?.directory ?? directory,
    config,
    observer: createExecutionObserver({ silent }),
  };
}
