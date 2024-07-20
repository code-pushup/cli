import type { CreateNodes, CreateNodesContext } from '@nx/devkit';
import type { CreateNodesResult } from 'nx/src/utils/nx-plugin';
import { PROJECT_JSON_FILE_NAME } from '../internal/constants';
import { createTargets } from './target/targets';
import { CreateNodesOptions } from './types';
import { normalizedCreateNodesContext } from './utils';

// name has to be "createNodes" to get picked up by Nx
export const createNodes: CreateNodes = [
  `**/${PROJECT_JSON_FILE_NAME}`,
  async (
    projectConfigurationFile: string,
    createNodesOptions: unknown,
    context: CreateNodesContext,
  ): Promise<CreateNodesResult> => {
    const parsedCreateNodesOptions = createNodesOptions as CreateNodesOptions;
    const normalizedContext = await normalizedCreateNodesContext(
      context,
      projectConfigurationFile,
      parsedCreateNodesOptions,
    );

    return {
      projects: {
        [normalizedContext.projectRoot]: {
          targets: await createTargets(normalizedContext),
        },
      },
    };
  },
];
