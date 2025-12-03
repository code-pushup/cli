import type { Settings } from '../models.js';
import type { ProjectConfig } from '../monorepo/index.js';

export type CommandContext = Pick<
  Settings,
  'bin' | 'config' | 'directory' | 'silent'
> & {
  project?: string;
};

export function createCommandContext(
  { config, bin, directory, silent }: Settings,
  project: ProjectConfig | null | undefined,
): CommandContext {
  return {
    bin: project?.bin ?? bin,
    directory: project?.directory ?? directory,
    silent,
    config,
    ...(project?.name && { project: project.name }),
  };
}
