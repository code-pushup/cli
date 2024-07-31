import { join } from 'node:path';
import type { PersistConfig, UploadConfig } from '@code-pushup/models';
import { parseEnv } from './env';
import {
  BaseNormalizedExecutorContext,
  GlobalExecutorOptions,
  ProjectExecutorOnlyOptions,
} from './types';

export function globalConfig(
  options: Partial<GlobalExecutorOptions & Record<string, unknown>>,
  context: BaseNormalizedExecutorContext,
): Omit<Required<GlobalExecutorOptions>, 'bin'> &
  Pick<GlobalExecutorOptions, 'bin'> {
  const { projectConfig } = context;
  const { root: projectRoot = '' } = projectConfig ?? {};
  // For better debugging use `--verbose --no-progress` as default
  const { verbose, progress, config } = options;
  return {
    verbose: !!verbose,
    progress: !!progress,
    config: config ?? join(projectRoot, 'code-pushup.config.ts'),
  };
}

export function persistConfig(
  options: Partial<PersistConfig & ProjectExecutorOnlyOptions>,
  context: BaseNormalizedExecutorContext,
): Partial<PersistConfig> {
  const { projectConfig, workspaceRoot } = context;

  const { name: projectName = '' } = projectConfig ?? {};
  const {
    format,
    outputDir = join(workspaceRoot, '.code-pushup', projectName), // always in <root>/.code-pushup/<project-name>,
    filename,
  } = options;

  return {
    outputDir,
    ...(format ? { format } : {}),
    ...(filename ? { filename } : {}),
  };
}

export function uploadConfig(
  options: Partial<UploadConfig & ProjectExecutorOnlyOptions>,
  context: BaseNormalizedExecutorContext,
): Partial<UploadConfig> {
  const { projectConfig, workspaceRoot } = context;

  const { name: projectName } = projectConfig ?? {};
  const { projectPrefix, server, apiKey, organization, project, timeout } =
    options;
  const applyPrefix = workspaceRoot === '.';
  const prefix = projectPrefix ? `${projectPrefix}-` : '';
  return {
    ...(projectName
      ? {
          project: applyPrefix ? `${prefix}${projectName}` : projectName, // provide correct project
        }
      : {}),
    ...parseEnv(process.env),
    ...Object.fromEntries(
      Object.entries({ server, apiKey, organization, project, timeout }).filter(
        ([_, v]) => v !== undefined,
      ),
    ),
  };
}
