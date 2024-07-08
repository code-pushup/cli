import { join, resolve } from 'node:path';
import type { PersistConfig, UploadConfig } from '@code-pushup/models';
import { persistConfigSchema, uploadConfigSchema } from '../../internal/schema';
import { BaseNormalizedExecutorContext } from '../../internal/types';
import { AutorunExecutorOnlyOptions } from '../autorun/types';
import { parseEnv } from './env';

export type GlobalOptions = { verbose: boolean; progress: boolean };

export function globalConfig(
  options: Partial<GlobalOptions> = {},
): Required<GlobalOptions> {
  const { verbose = false, progress = false } = options;
  return {
    // For better debugging use `--verbose --no-progress`
    verbose,
    progress,
  };
}

export type ExecutorPersistConfig = PersistConfig & { projectPrefix: string };
export async function persistConfig(
  options: Partial<ExecutorPersistConfig>,
  context: BaseNormalizedExecutorContext,
): Promise<PersistConfig> {
  const { workspaceRoot, projectConfig } = context;
  const persistCfgSchema = await persistConfigSchema();

  const { name: projectName = '', root: projectRoot = '' } =
    projectConfig ?? {};

  const {
    format = ['json'], // * - For all formats use `--persist.format=md,json`
    outputDir = join(
      resolve(projectRoot, workspaceRoot),
      '.code-pushup',
      projectName,
    ), // always in root .code-pushup/<project>,
    filename = `${projectName}-report.json`,
  } = options;
  return persistCfgSchema.parse({
    format,
    outputDir,
    filename,
  });
}

export type ExecutorUploadConfig = UploadConfig &
  Partial<Pick<AutorunExecutorOnlyOptions, 'projectPrefix'>>;

export async function uploadConfig(
  options: Partial<ExecutorUploadConfig>,
  context: BaseNormalizedExecutorContext,
): Promise<UploadConfig> {
  const { projectConfig, workspaceRoot } = context;
  const uploadCfgSchema = (await uploadConfigSchema()) as {
    parse: (...args: unknown[]) => UploadConfig;
  };

  const { name: projectName } = projectConfig ?? {};

  const { projectPrefix, server, apiKey, organization, project, timeout } =
    options;
  const applyPrefix = workspaceRoot === '.';
  const prefix = projectPrefix ? `${projectPrefix}-` : '';
  return uploadCfgSchema.parse({
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
  });
}
