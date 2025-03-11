import type {
  CreateNodes,
  CreateNodesContext,
  CreateNodesResult,
} from '@nx/devkit';
import { PROJECT_JSON_FILE_NAME } from '../internal/constants.js';
import { createTargets } from './target/targets.js';
import type { CreateNodesOptions } from './types.js';
import { normalizedCreateNodesContext } from './utils.js';

// name has to be "createNodes" to get picked up by Nx <v20
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
