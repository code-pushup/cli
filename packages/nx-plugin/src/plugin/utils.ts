import type {ProjectConfiguration} from '@nx/devkit';
import {readFile} from 'node:fs/promises';
import * as path from 'node:path';
import {dirname, join} from 'node:path';
import {createTargets} from './target/targets';
import type {CreateNodesOptions, NormalizedCreateNodesOptions} from './types';
import {CP_TARGET_NAME} from './constants.js';
import type {CreateNodesOptions, NormalizedCreateNodesContext,} from './types.js';

export async function normalizedCreateNodesContext(
  context: CreateNodesContext,
  projectConfigurationFile: string,
  createOptions: CreateNodesOptions = {},
): Promise<NormalizedCreateNodesContext> {
  const projectRoot = path.dirname(projectConfigurationFile);

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
  const projectConfiguration = (await readFile(
    join(process.cwd(), projectConfigurationFile),
    'utf8',
  ).then(JSON.parse)) as Omit<ProjectConfiguration, 'root'> & { root?: string };
  if (
    !('name' in projectConfiguration) ||
    typeof projectConfiguration.name !== 'string'
  ) {
    throw new Error('Project name is required');
  }
  return {
    ...projectConfiguration,
    root: projectConfiguration.root ?? dirname(projectConfigurationFile),
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
