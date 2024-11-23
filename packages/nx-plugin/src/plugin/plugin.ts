import type { CreateNodes, CreateNodesContext } from '@nx/devkit';
import type { CreateNodesResult } from 'nx/src/utils/nx-plugin';
import { PROJECT_JSON_FILE_NAME } from '../internal/constants';
import {
  createProjectConfiguration,
  loadProjectConfiguration,
  normalizeCreateNodesOptions,
} from './utils';

type FileMatcher = `${string}${typeof PROJECT_JSON_FILE_NAME}`;

// name has to be "createNodes" to get picked up by Nx
export const createNodes = [
  `**/${PROJECT_JSON_FILE_NAME}` as FileMatcher,
  createNodesV1Fn,
] satisfies CreateNodes;

export async function createNodesV1Fn(
  projectConfigurationFile: string,
  createNodesOptions: unknown,
  _: CreateNodesContext,
): Promise<CreateNodesResult> {
  const projectJson = await loadProjectConfiguration(projectConfigurationFile);
  const createOptions = normalizeCreateNodesOptions(createNodesOptions);

  const { targets } = await createProjectConfiguration(
    projectJson,
    createOptions,
  );
  return {
    projects: {
      [projectJson.root]: {
        targets,
      },
    },
  };
}
