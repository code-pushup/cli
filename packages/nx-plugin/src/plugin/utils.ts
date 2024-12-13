import type { CreateNodesContext } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CP_TARGET_NAME } from './constants.js';
import type {
  CreateNodesOptions,
  NormalizedCreateNodesContext,
  ProjectConfigurationWithName,
} from './types.js';

export async function normalizedCreateNodesContext(
  context: CreateNodesContext,
  projectConfigurationFile: string,
  createOptions: CreateNodesOptions = {},
): Promise<NormalizedCreateNodesContext> {
  const projectRoot = path.dirname(projectConfigurationFile);

  try {
    const projectJson = JSON.parse(
      (await readFile(projectConfigurationFile)).toString(),
    ) as ProjectConfigurationWithName;

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
