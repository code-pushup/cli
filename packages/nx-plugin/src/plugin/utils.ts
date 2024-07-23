import { CreateNodesContext, ProjectConfiguration } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { CreateNodesOptions, NormalizedCreateNodesContext } from './types';

export async function normalizedCreateNodesContext(
  context: CreateNodesContext,
  projectConfigurationFile: string,
  createOptions: CreateNodesOptions = {},
): Promise<NormalizedCreateNodesContext> {
  const projectRoot = dirname(projectConfigurationFile);

  const projectJson: ProjectConfiguration = JSON.parse(
    (await readFile(projectConfigurationFile)).toString(),
  ) as ProjectConfiguration | undefined;
  return {
    ...context,
    projectJson: projectJson ?? {},
    projectRoot,
    createOptions,
  };
}
