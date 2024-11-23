import { ProjectConfiguration } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { CP_TARGET_NAME } from './constants';
import { createTargets } from './target/targets';
import { CreateNodesOptions, NormalizedCreateNodesOptions } from './types';

export function normalizeCreateNodesOptions(
  options: unknown = {},
): NormalizedCreateNodesOptions {
  const { targetName = CP_TARGET_NAME } = options as CreateNodesOptions;
  return {
    ...(options as CreateNodesOptions),
    targetName,
  };
}

export async function loadProjectConfiguration(
  projectConfigurationFile: string,
): Promise<ProjectConfiguration> {
  const projectConfiguration: ProjectConfiguration = await readFile(
    join(process.cwd(), projectConfigurationFile),
    'utf8',
  ).then(JSON.parse);
  if (
    !('name' in projectConfiguration) ||
    typeof projectConfiguration.name !== 'string'
  ) {
    throw new Error('Project name is required');
  }
  return {
    ...projectConfiguration,
    root: projectConfiguration?.root ?? dirname(projectConfigurationFile),
  };
}

export async function createProjectConfiguration(
  projectConfiguration: ProjectConfiguration,
  options: CreateNodesOptions,
): Promise<
  Pick<ProjectConfiguration, 'targets'> &
    Partial<Pick<ProjectConfiguration, 'namedInputs'>>
> {
  const normalizeOptions = normalizeCreateNodesOptions(options);
  return {
    namedInputs: {},
    targets: await createTargets(projectConfiguration, normalizeOptions),
  };
}
