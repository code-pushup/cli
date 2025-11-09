import type { Settings } from '../models.js';
import type { ProjectConfig } from '../monorepo/index.js';

export type CommandContext = Pick<Settings, 'bin' | 'config' | 'directory'> & {
  project?: string;
};

export function createCommandContext(
  { config, bin, directory }: Settings,
  project: ProjectConfig | null | undefined,
): CommandContext {
  return {
    bin: project?.bin ?? bin,
    directory: project?.directory ?? directory,
    config,
    ...(project?.name && { project: project.name }),
  };
}
