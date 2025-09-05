import type { PersistConfig, UploadConfig } from '@code-pushup/models';
import type { AutorunCommandExecutorPersistConfig } from '../cli/schema.js';
import { parseEnv } from './env.js';
import type { GlobalExecutorOptions } from './types.js';

export function globalConfig(
  options: Partial<GlobalExecutorOptions & Record<string, unknown>>,
): GlobalExecutorOptions {
  // For better debugging use `--verbose --no-progress` as default
  const { verbose, progress, config } = options;
  return {
    verbose: !!verbose,
    progress: !!progress,
    config: config ?? '{projectRoot}/code-pushup.config.ts',
  };
}

export function persistConfig(
  options: Partial<PersistConfig>,
): AutorunCommandExecutorPersistConfig {
  const {
    format,
    outputDir = '{projectRoot}/.code-pushup',
    filename,
  } = options;

  return {
    outputDir,
    ...(format ? { format } : {}),
    ...(filename ? { filename } : {}),
  };
}

export function uploadConfig(
  options: Partial<UploadConfig>,
): Partial<UploadConfig> {
  const { server, apiKey, organization, project, timeout } = {
    ...options,
    ...parseEnv(process.env),
  };
  return {
    ...Object.fromEntries(
      Object.entries({
        server,
        apiKey,
        organization,
        project,
        timeout,
      }).filter(([_, v]) => v != null && v !== ''),
    ),
  };
}
