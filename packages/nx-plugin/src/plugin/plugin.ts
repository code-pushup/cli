import type {
  CreateNodes,
  CreateNodesContext,
  CreateNodesContextV2,
  CreateNodesResult,
  CreateNodesResultV2,
  CreateNodesV2,
  NxPlugin,
} from '@nx/devkit';
import { PROJECT_JSON_FILE_NAME } from '../internal/constants.js';
import { createTargets } from './target/targets.js';
import type { CreateNodesOptions } from './types.js';
import {
  normalizedCreateNodesContext,
  normalizedCreateNodesV2Context,
} from './utils.js';

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

export const createNodesV2: CreateNodesV2 = [
  `**/${PROJECT_JSON_FILE_NAME}`,
  async (
    projectConfigurationFiles: readonly string[],
    createNodesOptions: unknown,
    context: CreateNodesContextV2,
  ): Promise<CreateNodesResultV2> => {
    const parsedCreateNodesOptions =
      (createNodesOptions as CreateNodesOptions) ?? {};

    return await Promise.all(
      projectConfigurationFiles.map(async projectConfigurationFile => {
        const normalizedContext = await normalizedCreateNodesV2Context(
          context,
          projectConfigurationFile,
          parsedCreateNodesOptions,
        );

        const result: CreateNodesResult = {
          projects: {
            [normalizedContext.projectRoot]: {
              targets: await createTargets(normalizedContext),
            },
          },
        };

        return [projectConfigurationFile, result] as const;
      }),
    );
  },
];

export const plugin = {
  name: 'code-pushup',
  createNodesV2: createNodesV2 as CreateNodesV2,
  createNodes,
} satisfies NxPlugin;
