import { CreateNodesContext } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { CP_TARGET_NAME } from './constants';
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

    const { targetName = CP_TARGET_NAME } = createOptions;
    return {
      ...context,
      projectJson,
      projectRoot,
      createOptions: {
        ...createOptions,
        targetName,
      },
    };
  } catch {
    throw new Error(
      `Error parsing project.json file ${projectConfigurationFile}.`,
    );
  }
}
