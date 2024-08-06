import { CreateNodesContext } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  CreateNodesOptions,
  NormalizedCreateNodesContext,
  ProjectConfigWithName,
} from './types';

export async function normalizedCreateNodesContext(
  context: CreateNodesContext,
  projectConfigurationFile: string,
  createOptions: CreateNodesOptions = {},
): Promise<NormalizedCreateNodesContext> {
  const projectRoot = dirname(projectConfigurationFile);

  try {
    const projectJson = JSON.parse(
      (await readFile(projectConfigurationFile)).toString(),
    ) as ProjectConfigWithName;

    return {
      ...context,
      projectJson,
      projectRoot,
      createOptions,
    };
  } catch {
    throw new Error(
      `Error parsing project.json file ${projectConfigurationFile}.`,
    );
  }
}
