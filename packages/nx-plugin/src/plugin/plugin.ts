import type { CreateNodes, CreateNodesContext } from '@nx/devkit';
import type { CreateNodesResult } from 'nx/src/utils/nx-plugin';
import { PROJECT_JSON_FILE_NAME } from '../internal/constants';
import {
  createProjectConfiguration,
  loadProjectConfiguration,
  normalizeCreateNodesOptions,
} from './utils';

// name has to be "createNodes" to get picked up by Nx
export const createNodes: CreateNodes = [
  `**/${PROJECT_JSON_FILE_NAME}`,
  async (
    projectConfigurationFile: string,
    createNodesOptions: unknown,
    context: CreateNodesContext,
  ): Promise<CreateNodesResult> => {
    const projectJson = await loadProjectConfiguration(
      projectConfigurationFile,
    );
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
  },
];
