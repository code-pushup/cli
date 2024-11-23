import { globalConfig, persistConfig, uploadConfig } from '../internal/config';
import type { NormalizedExecutorContext } from '../internal/context';
import type {
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
  const { projectPrefix, persist, upload, command } = options;
  const needsUploadParams =
    command === 'upload' || command === 'autorun' || command === undefined;
  return {
    ...parseAutorunExecutorOnlyOptions(options),
    ...globalConfig(options, normalizedContext),
    persist: persistConfig({ projectPrefix, ...persist }, normalizedContext),
    // @TODO This is a hack to avoid validation errors of upload config for commands that dont need it.
    // Fix: use utils and execute the core logic directly
    // Blocked by Nx plugins can't compile to es6
    upload: needsUploadParams
      ? uploadConfig({ projectPrefix, ...upload }, normalizedContext)
      : undefined,
  };
}
