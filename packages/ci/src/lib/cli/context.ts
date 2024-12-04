import type { Settings } from '../models';
import type { ProjectConfig } from '../monorepo';

export type CommandContext = Pick<
  Settings,
  'bin' | 'config' | 'directory' | 'silent'
>;

export function createCommandContext(
  settings: Settings,
  project: ProjectConfig | null | undefined,
): CommandContext {
  return {
    bin: project?.bin ?? settings.bin,
    directory: project?.directory ?? settings.directory,
    config: settings.config,
    silent: settings.silent,
  };
}
