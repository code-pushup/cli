import { join, resolve } from 'node:path';
import { z } from 'zod';
import type { PersistConfig, UploadConfig } from '@code-pushup/models';
import { ExecutorOnlyOptions } from '../executors/autorun/types';
import { BaseNormalizedExecutorContext } from './types';

export type GlobalOptions = { verbose: boolean; progress: boolean };

export function globalConfig(
  options: Partial<GlobalOptions> = {},
): Required<GlobalOptions> {
  return {
    // For better debugging use `--verbose --no-progress`
    verbose: false,
    progress: false,
    ...options,
  };
}

export type ExecutorPersistConfig = PersistConfig & { projectPrefix: string };
export function persistConfig(
  options: Partial<ExecutorPersistConfig>,
  context: BaseNormalizedExecutorContext,
): PersistConfig {
  const { workspaceRoot, projectConfig } = context;

  const { name: projectName = '', root: projectRoot = '' } =
    projectConfig ?? {};
  const { format, outputDir, filename } = options;
  return {
    format: format ?? ['md', 'json'], // * - For all formats use `--persist.format=md,json`
    outputDir:
      outputDir ??
      join(resolve(projectRoot, workspaceRoot), '.code-pushup', projectName), // always in root .code-pushup/<project>,
    filename,
  };
}

// load upload configuration from environment
const envSchema = z
  .object({
    CP_SERVER: z.string().url(),
    CP_API_KEY: z.string().min(1),
    CP_ORGANIZATION: z.string().min(1),
    CP_PROJECT: z.string().min(1),
    CP_TIMEOUT: z.number().optional(),
  })
  .partial();
type UploadEnvVars = z.infer<typeof envSchema>;

async function parseEnv(env: unknown = {}): Promise<UploadConfig> {
  const upload: UploadEnvVars = await envSchema.parseAsync(env);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return Object.fromEntries(
    Object.entries(upload).map(([envKey, value]) => {
      switch (envKey) {
        case 'CP_SERVER':
          return ['server', value];
        case 'CP_API_KEY':
          return ['apiKey', value];
        case 'CP_ORGANIZATION':
          return ['organization', value];
        case 'CP_PROJECT':
          return ['project', value];
        case 'CP_TIMEOUT':
          return ['timeout', value];
        default:
          return [];
      }
    }),
  );
}

export type ExecutorUploadConfig = UploadConfig &
  Pick<ExecutorOnlyOptions, 'projectPrefix'>;

export async function uploadConfig(
  options: Partial<ExecutorUploadConfig>,
  context: BaseNormalizedExecutorContext,
): Promise<UploadConfig> {
  const { projectConfig, workspaceRoot } = context;

  const { name: projectName } = projectConfig ?? {};

  const { projectPrefix, server, apiKey, organization, project, timeout } =
    options;
  const applyPrefix = workspaceRoot === '.';
  const prefix = projectPrefix ? `${projectPrefix}-` : '';
  return {
    ...(await parseEnv(process.env)),
    ...(projectName
      ? {
          project: applyPrefix ? `${prefix}${projectName}` : projectName, // provide correct project
        }
      : {}),
    ...Object.fromEntries(
      Object.entries({ server, apiKey, organization, project, timeout }).filter(
        ([_, v]) => v !== undefined,
      ),
    ),
  };
}
