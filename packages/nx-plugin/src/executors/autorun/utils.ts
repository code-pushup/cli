import { globalConfig, persistConfig, uploadConfig } from '../internal/config';
import { NormalizedExecutorContext } from '../internal/context';
import {
  AutorunCommandExecutorOnlyOptions,
  AutorunCommandExecutorOptions,
} from './schema';

export function autorunExecutorOnlyConfig(
  options: Partial<AutorunCommandExecutorOnlyOptions>,
): AutorunCommandExecutorOnlyOptions {
  // For better debugging use `--verbose --no-progress` as default
  const { projectPrefix, dryRun, onlyPlugins } = options;
  return {
    ...(projectPrefix == null ? {} : { projectPrefix }),
    ...(dryRun == null ? {} : { dryRun: dryRun }),
    ...(onlyPlugins ? { onlyPlugins } : {}),
  };
}

export async function getExecutorOptions(
  options: Partial<AutorunCommandExecutorOptions>,
  normalizedContext: NormalizedExecutorContext,
): Promise<AutorunCommandExecutorOptions> {
  const { projectPrefix, persist, upload } = options;
  return {
    ...globalConfig(options, normalizedContext),
    ...autorunExecutorOnlyConfig(options),
    persist: persistConfig({ projectPrefix, ...persist }, normalizedContext),
    upload: await uploadConfig({ projectPrefix, ...upload }, normalizedContext),
  };
}
