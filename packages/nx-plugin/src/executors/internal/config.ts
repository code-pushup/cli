import { join } from 'node:path';
import type { PersistConfig, UploadConfig } from '@code-pushup/models';
import { AutorunExecutorOnlyOptions } from '../autorun/types';
import { parseEnv } from './env';
import { BaseNormalizedExecutorContext } from './types';

export type GlobalOptions = { verbose: boolean; progress: boolean };

export function globalConfig(
  options: Partial<Record<string, unknown>>,
): Required<GlobalOptions> {
  // For better debugging use `--verbose --no-progress` as default
  const { verbose, progress } = options;
  return {
    verbose: !!verbose,
    progress: !!progress,
  };
}

export type ExecutorPersistConfig = PersistConfig & { projectPrefix: string };

export function persistConfig(
  options: Partial<ExecutorPersistConfig>,
  context: BaseNormalizedExecutorContext,
): PersistConfig {
  const { projectConfig } = context;

  const { name: projectName = '', root: projectRoot = '' } =
    projectConfig ?? {};
  const {
    format = ['json'], // * - For all formats use `--persist.format=md,json`
    outputDir = join(projectRoot, '.code-pushup', projectName), // always in <root>/.code-pushup/<project-name>,
    filename: filenameOptions,
  } = options;

  const postfix = '-report';
  const filename = `${slugify(filenameOptions ?? projectName)}${postfix}`;
  return {
    format,
    outputDir,
    filename,
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