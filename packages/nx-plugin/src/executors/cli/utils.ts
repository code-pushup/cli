import {
  globalConfig,
  persistConfig,
  uploadConfig,
} from '../internal/config.js';
import type { NormalizedExecutorContext } from '../internal/context.js';
import type {
  CliCommandExecutorOnlyOptions,
  CliCommandExecutorOptions,
  PrintConfigCommandExecutorOptions,
} from './schema.js';

export function parseCliExecutorOnlyOptions(
  options: Partial<CliCommandExecutorOnlyOptions>,
): CliCommandExecutorOnlyOptions {
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

export function parseCliExecutorOptions(
  options: Partial<CliCommandExecutorOptions>,
  normalizedContext: NormalizedExecutorContext,
): CliCommandExecutorOptions {
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
    ...parseCliExecutorOnlyOptions(options),
    ...globalConfig(options, normalizedContext),
    ...(output ? { output } : {}),
    persist: persistConfig({ projectPrefix, ...persist }, normalizedContext),
    // @TODO This is a hack to avoid validation errors of upload config for commands that dont need it.
    // Fix: use utils and execute the core logic directly
    // Blocked by Nx plugins can't compile to es6
    ...(needsUploadParams && hasApiToken ? { upload: uploadCfg } : {}),
  };
}
