import type { Settings } from '../models.js';
import type { ProjectConfig } from '../monorepo/index.js';

export type CommandContext = Pick<
  Settings,
  'bin' | 'config' | 'directory' | 'silent' | 'output'
> & {
  project?: string;
};

export function createCommandContext(
  settings: Settings,
  project: ProjectConfig | null | undefined,
): CommandContext {
  return {
    project: project?.name,
    bin: project?.bin ?? settings.bin,
    directory: project?.directory ?? settings.directory,
    config: settings.config,
    silent: settings.silent,
    output: settings.output.replaceAll('{project}', project?.name ?? ''),
  };
}
