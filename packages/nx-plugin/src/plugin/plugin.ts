import {
  type CreateNodes,
  type CreateNodesContext,
  type CreateNodesResult,
  type CreateNodesV2,
  createNodesFromFiles,
} from '@nx/devkit';
import { PROJECT_JSON_FILE_NAME } from '../internal/constants.js';
import { createTargets } from './target/targets.js';
import type { CreateNodesOptions } from './types.js';
import { normalizedCreateNodesContext } from './utils.js';

/** Create the nodes for a V1 Plugin. The name `createNodes` is required by Nx in order to be picked up as a plugin. */
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

/** Create the nodes for a V2 Plugin. The name `createNodesV2` is required by Nx in order to be picked up as a plugin. */
export const createNodesV2: CreateNodesV2 = [
  `**/${PROJECT_JSON_FILE_NAME}`,
  async (configFiles, options, context) =>
    createNodesFromFiles(
      async (globMatchingFile, internalOptions) => {
        const parsedCreateNodesOptions = internalOptions as CreateNodesOptions;

        const normalizedContext = await normalizedCreateNodesContext(
          context,
          globMatchingFile,
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
      configFiles,
      options,
      context,
    ),
];
