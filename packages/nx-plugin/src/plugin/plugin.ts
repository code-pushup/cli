import type {
  CreateNodes,
  CreateNodesContext,
  CreateNodesResult,
} from '@nx/devkit';
import { normalizeCreateNodesOptions } from '@push-based/nx-verdaccio/src/plugin/normalize-create-nodes-options';
import { createProjectConfiguration } from '@push-based/nx-verdaccio/src/plugin/targets/create-targets';
import { PROJECT_JSON_FILE_NAME } from '../internal/constants';

type FileMatcher = `${string}${typeof PROJECT_JSON_FILE_NAME}`;
const PROJECT_JSON_FILE_GLOB = `**/${PROJECT_JSON_FILE_NAME}` as FileMatcher;

// name has to be "createNodes" to get picked up by Nx
export const createNodes = [
  PROJECT_JSON_FILE_GLOB,
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
