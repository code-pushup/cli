import {
  globalConfig,
  persistConfig,
  uploadConfig,
} from '../internal/config.js';
import type { NormalizedExecutorContext } from '../internal/context.js';
import type {
  AutorunCommandExecutorOnlyOptions,
  AutorunCommandExecutorOptions,
  PrintConfigCommandExecutorOptions,
} from './schema.js';

export function parseAutorunExecutorOnlyOptions(
  options: Partial<AutorunCommandExecutorOnlyOptions>,
): AutorunCommandExecutorOnlyOptions {
  const { projectPrefix, dryRun, onlyPlugins, env, bin } = options;
  return {
    ...(projectPrefix && { projectPrefix }),
    ...(dryRun != null && { dryRun }),
    ...(onlyPlugins && { onlyPlugins }),
    ...(env && { env }),
    ...(bin && { bin }),
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
  options: Partial<AutorunCommandExecutorOptions>,
  normalizedContext: NormalizedExecutorContext,
): AutorunCommandExecutorOptions {
  const { projectPrefix, persist, upload, command, output } = options;
  const needsUploadParams =
    command === 'upload' || command === 'autorun' || command === undefined;
  const uploadCfg = uploadConfig(
    { projectPrefix, ...upload },
    normalizedContext,
  );
  const hasApiToken = uploadCfg?.apiKey != null;
  return {
    ...parsePrintConfigExecutorOptions(options),
    ...parseAutorunExecutorOnlyOptions(options),
    ...globalConfig(options, normalizedContext),
    ...(output ? { output } : {}),
    persist: persistConfig({ projectPrefix, ...persist }, normalizedContext),
    // @TODO This is a hack to avoid validation errors of upload config for commands that dont need it.
    // Fix: use utils and execute the core logic directly
    // Blocked by Nx plugins can't compile to es6
    ...(needsUploadParams && hasApiToken ? { upload: uploadCfg } : {}),
  };
}
