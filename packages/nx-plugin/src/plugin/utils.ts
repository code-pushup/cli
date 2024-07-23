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

  try {
    const projectJson = JSON.parse(
      (await readFile(projectConfigurationFile)).toString(),
    ) as ProjectConfiguration;

    return {
      ...context,
      projectJson,
      projectRoot,
      createOptions,
    };
  } catch (error: unknown) {
    throw new Error(
      `Error parsing project.json file ${projectConfigurationFile}.`,
    );
  }
}
