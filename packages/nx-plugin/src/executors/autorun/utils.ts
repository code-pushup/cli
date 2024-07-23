import { globalConfig, persistConfig, uploadConfig } from '../internal/config';
import { NormalizedExecutorContext } from '../internal/context';
import {
  AutorunCommandExecutorOnlyOptions,
  AutorunCommandExecutorOptions,
} from './schema';

export function parseAutorunExecutorOnlyOptions(
  options: Partial<AutorunCommandExecutorOnlyOptions>,
): AutorunCommandExecutorOnlyOptions {
  const { projectPrefix, dryRun, onlyPlugins } = options;
  return {
    ...(projectPrefix && { projectPrefix }),
    ...(dryRun != null && { dryRun }),
    ...(onlyPlugins && { onlyPlugins }),
  };
}

export function parseAutorunExecutorOptions(
  options: Partial<AutorunCommandExecutorOptions>,
  normalizedContext: NormalizedExecutorContext,
): AutorunCommandExecutorOptions {
  const { projectPrefix, persist, upload } = options;
  return {
    ...parseAutorunExecutorOnlyOptions(options),
    ...globalConfig(options, normalizedContext),
    persist: persistConfig({ projectPrefix, ...persist }, normalizedContext),
    upload: uploadConfig({ projectPrefix, ...upload }, normalizedContext),
  };
}
