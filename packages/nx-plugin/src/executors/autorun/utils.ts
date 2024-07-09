import { AutorunCommandExecutorOnlyOptions } from './schema';

export function autorunExecutorOnlyConfig(
  options: Partial<AutorunCommandExecutorOnlyOptions>,
): Required<AutorunCommandExecutorOnlyOptions> {
  // For better debugging use `--verbose --no-progress` as default
  const { projectPrefix, dryRun, onlyPlugins } = options;
  return {
    projectPrefix: projectPrefix ?? '',
    dryRun: dryRun ?? false,
    onlyPlugins: onlyPlugins ?? [],
  };
}
