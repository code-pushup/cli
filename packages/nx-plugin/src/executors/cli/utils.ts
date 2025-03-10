import {
  globalConfig,
  persistConfig,
  uploadConfig,
} from '../internal/config.js';
import type { NormalizedExecutorContext } from '../internal/context.js';
import type {
  AutorunCommandExecutorOnlyOptions,
  AutorunCommandExecutorOptions,
} from './schema.js';

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
  const uploadCfg = uploadConfig(
    { projectPrefix, ...upload },
    normalizedContext,
  );
  const hasApiToken = uploadCfg?.apiKey != null;
  return {
    ...parseAutorunExecutorOnlyOptions(options),
    ...globalConfig(options, normalizedContext),
    persist: persistConfig({ projectPrefix, ...persist }, normalizedContext),
    // @TODO This is a hack to avoid validation errors of upload config for commands that dont need it.
    // Fix: use utils and execute the core logic directly
    // Blocked by Nx plugins can't compile to es6
    ...(needsUploadParams && hasApiToken ? { upload: uploadCfg } : {}),
  };
}

/**
 * Deeply merges executor options.
 *
 * @param targetOptions - The original options from the target configuration.
 * @param cliOptions - The options from Nx, combining target options and CLI arguments.
 * @returns A new object with deeply merged properties.
 *
 * Nx performs a shallow merge by default, where command-line arguments can override entire objects
 * (e.g., `--persist.filename` replaces the entire `persist` object).
 * This function ensures that nested properties are deeply merged,
 * preserving the original target options where CLI arguments are not provided.
 */
export function mergeExecutorOptions(
  targetOptions: Partial<AutorunCommandExecutorOptions>,
  cliOptions: Partial<AutorunCommandExecutorOptions>,
): AutorunCommandExecutorOptions {
  return {
    ...targetOptions,
    ...cliOptions,
    ...(targetOptions?.persist || cliOptions?.persist
      ? {
          persist: {
            ...targetOptions?.persist,
            ...cliOptions?.persist,
          },
        }
      : {}),
    ...(targetOptions?.upload || cliOptions?.upload
      ? {
          upload: {
            ...targetOptions?.upload,
            ...cliOptions?.upload,
          },
        }
      : {}),
  };
}
