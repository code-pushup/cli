import type { CIConfig } from '../config';
import type { ProjectConfig } from '../monorepo';

export type CommandContext = Pick<
  CIConfig,
  'bin' | 'config' | 'directory' | 'silent'
> & {
  project?: string;
};

export function createCommandContext(
  config: CIConfig,
  project: ProjectConfig | null | undefined,
): CommandContext {
  return {
    project: project?.name,
    bin: project?.bin ?? config.bin,
    directory: project?.directory ?? config.directory,
    config: config.config,
    silent: config.silent,
  };
}
