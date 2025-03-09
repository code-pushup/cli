import {
  CreateNodes,
  CreateNodesContext,
  CreateNodesResult,
  CreateNodesV2,
  createNodesFromFiles,
} from '@nx/devkit';
import { PROJECT_JSON_FILE_NAME } from '../internal/constants';
import { createTargets } from './target/targets';
import type { CreateNodesOptions } from './types';
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

export const createNodesV2: CreateNodesV2<any> = [
  `**/${PROJECT_JSON_FILE_NAME}`,

  async (configFiles, options, context) => {
    return await createNodesFromFiles(
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
    );
  },
];
