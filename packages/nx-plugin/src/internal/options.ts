import {
  AutorunCommandExecutorOnlyOptions,
  CliExecutorOptions,
  PrintConfigCommandExecutorOptions,
} from '../executors/cli/schema.js';
import {
  globalConfig,
  persistConfig,
  uploadConfig,
} from '../executors/internal/config.js';

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

export function parsePrintConfigExecutorOptions(
  options: Partial<PrintConfigCommandExecutorOptions>,
): PrintConfigCommandExecutorOptions {
  const { output } = options;
  return {
    ...(output && { output }),
  };
}

export function parseAutorunExecutorOptions(
  options: Partial<CliExecutorOptions>,
): CliExecutorOptions {
  const { persist, upload, command } = options;
  const needsUploadParams =
    command === 'upload' || command === 'autorun' || command === undefined;
  const uploadCfg = uploadConfig(upload ?? {});
  const hasApiToken = uploadCfg?.apiKey != null;
  return {
    ...parsePrintConfigExecutorOptions(options),
    ...parseAutorunExecutorOnlyOptions(options),
    ...globalConfig(options),
    persist: persistConfig(persist ?? {}),
    // @TODO This is a hack to avoid validation errors of upload config for commands that dont need it.
    // Fix: use utils and execute the core logic directly
    // Blocked by Nx plugins can't compile to es6
    ...(needsUploadParams && hasApiToken ? { upload: uploadCfg } : {}),
  };
}
