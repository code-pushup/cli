import type { CreateNodesContext, CreateNodesContextV2 } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { DEFAULT_TARGET_NAME } from '../internal/constants.js';
import type {
  CreateNodesOptions,
  NormalizedCreateNodesContext,
  NormalizedCreateNodesV2Context,
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

    const { targetName = DEFAULT_TARGET_NAME } = createOptions;
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

export async function normalizedCreateNodesV2Context(
  context: CreateNodesContextV2,
  projectConfigurationFile: string,
  createOptions: CreateNodesOptions = {},
): Promise<NormalizedCreateNodesV2Context> {
  const projectRoot = path.dirname(projectConfigurationFile);

  try {
    const projectJson = JSON.parse(
      (await readFile(projectConfigurationFile)).toString(),
    ) as ProjectConfigurationWithName;

    const { targetName = DEFAULT_TARGET_NAME } = createOptions;
    return {
      ...context,
      projectJson,
      projectRoot,
      createOptions: { ...createOptions, targetName },
    };
  } catch {
    throw new Error(
      `Error parsing project.json file ${projectConfigurationFile}.`,
    );
  }
}

export function getPrefixedProjectName(options: {
  isRoot: boolean;
  projectPrefix?: string;
}): string {
  const { projectPrefix, isRoot } = options;
  const prefix = projectPrefix ? `${projectPrefix}-` : '';
  return isRoot ? `${prefix}{projectName}` : '{projectName}';
}
