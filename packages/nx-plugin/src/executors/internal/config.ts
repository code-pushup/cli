import { join, resolve } from 'node:path';
import type { PersistConfig, UploadConfig } from '@code-pushup/models';
import { AutorunExecutorOnlyOptions } from '../autorun/types';
import { BaseNormalizedExecutorContext } from '../internal/types';
import { parseEnv } from './env';

export type GlobalOptions = { verbose: boolean; progress: boolean };

export function globalConfig(
  options: Partial<Record<string, unknown>>,
): Required<GlobalOptions> {
  // For better debugging use `--verbose --no-progress` as default
  const { verbose = true, progress = false } = options;
  return {
    verbose: verbose ? true : false,
    progress: progress ? true : false,
  };
}

export type ExecutorPersistConfig = PersistConfig & { projectPrefix: string };

export async function persistConfig(
  options: Partial<ExecutorPersistConfig>,
  context: BaseNormalizedExecutorContext,
): Promise<PersistConfig> {
  const { workspaceRoot, projectConfig } = context;

  const { name: projectName = '', root: projectRoot = '' } =
    projectConfig ?? {};
  const applyPrefix = workspaceRoot === '.';

  const {
    format = ['json'], // * - For all formats use `--persist.format=md,json`
    outputDir = join(
      resolve(projectRoot, workspaceRoot),
      '.code-pushup',
      projectName,
    ), // always in <root>/.code-pushup/<project-name>,
    filename: filenameOptions,
    projectPrefix,
  } = options;

  const prefix = projectPrefix ? `${projectPrefix}-` : '';
  const postfix = '-report';
  const filename = `${prefix}${
    applyPrefix ? projectPrefix : slugify(filenameOptions ?? projectName)
  }${postfix}`;
  return {
    format,
    outputDir,
    filename: filename, // provide correct project,
  };
}

export type ExecutorUploadConfig = UploadConfig &
  Partial<Pick<AutorunExecutorOnlyOptions, 'projectPrefix'>>;

export async function uploadConfig(
  options: Partial<ExecutorUploadConfig>,
  context: BaseNormalizedExecutorContext,
): Promise<Partial<UploadConfig>> {
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
    ...(await parseEnv(process.env)),
    ...Object.fromEntries(
      Object.entries({ server, apiKey, organization, project, timeout }).filter(
        ([_, v]) => v !== undefined,
      ),
    ),
  };
}

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+|\//g, '-')
    .replace(/[^a-z\d-]/g, '');
}
