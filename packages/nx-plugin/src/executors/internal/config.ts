import * as path from 'node:path';
import type { PersistConfig, UploadConfig } from '@code-pushup/models';
import type { NormalizedExecutorContext } from './context.js';
import { parseEnv } from './env.js';
import type {
  BaseNormalizedExecutorContext,
  GlobalExecutorOptions,
  ProjectExecutorOnlyOptions,
} from './types.js';

export function globalConfig(
  options: Partial<GlobalExecutorOptions & Record<string, unknown>>,
  context: BaseNormalizedExecutorContext,
): GlobalExecutorOptions {
  const { projectConfig } = context;
  const { root: projectRoot = '' } = projectConfig ?? {};
  // For better debugging use `--verbose --no-progress` as default
  const { verbose, progress, config } = options;
  return {
    verbose: !!verbose,
    progress: !!progress,
    config: config ?? path.join(projectRoot, 'code-pushup.config.ts'),
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
    outputDir = path.join(workspaceRoot, '.code-pushup', projectName), // always in <root>/.code-pushup/<project-name>,
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
  context: NormalizedExecutorContext,
): Partial<UploadConfig> {
  const { workspaceRoot, projectName } = context;

  const { projectPrefix, server, apiKey, organization, project, timeout } =
    options;
  const applyPrefix = workspaceRoot === '.';
  const prefix = projectPrefix ? `${projectPrefix}-` : '';

  const derivedProject =
    projectName && !project
      ? applyPrefix
        ? `${prefix}${projectName}`
        : projectName
      : project;

  return {
    ...parseEnv(process.env),
    ...Object.fromEntries(
      Object.entries({
        server,
        apiKey,
        organization,
        ...(derivedProject ? { project: derivedProject } : {}),
        timeout,
      }).filter(([_, v]) => v !== undefined),
    ),
  };
}
