import { join } from 'node:path';
import type { PersistConfig, UploadConfig } from '@code-pushup/models';
import { slugify } from '../../internal/utils';
import { parseEnv } from './env';
import {
  BaseNormalizedExecutorContext,
  GlobalExecutorOptions,
  ProjectExecutorOnlyOptions,
} from './types';

export function globalConfig(
  options: Partial<GlobalExecutorOptions>,
  context: BaseNormalizedExecutorContext,
): Required<GlobalExecutorOptions> {
  const { projectConfig } = context;
  const { root: projectRoot = '' } = projectConfig ?? {};
  // For better debugging use `--verbose --no-progress` as default
  const { verbose, progress, config } = options;
  return {
    verbose: !!verbose,
    progress: !!progress,
    config: config ?? join(projectRoot, 'code-pushup.config.json'),
  };
}

export function persistConfig(
  options: Partial<PersistConfig & ProjectExecutorOnlyOptions>,
  context: BaseNormalizedExecutorContext,
): Partial<PersistConfig> {
  const { projectConfig } = context;

  const { name: projectName = '', root: projectRoot = '' } =
    projectConfig ?? {};
  const {
    format = ['json'],
    outputDir = join(projectRoot, '.code-pushup', projectName), // always in <root>/.code-pushup/<project-name>,
    filename: filenameOptions,
  } = options;

  return {
    format,
    outputDir,
    ...(filenameOptions ? { filename: slugify(filenameOptions) } : {}),
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
