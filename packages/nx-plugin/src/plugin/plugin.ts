import {
  CreateNodes,
  CreateNodesContext,
  CreateNodesContextV2,
  CreateNodesResult,
  CreateNodesV2,
  createNodesFromFiles,
} from '@nx/devkit';
import { dirname } from 'path';
import {
  CODE_PUSHUP_CONFIG_REGEX,
  PROJECT_JSON_FILE_NAME,
} from '../internal/constants';
import { createTargets } from './target/targets';
import type { CreateNodesOptions } from './types';
import {
  normalizedCreateNodesContext,
  normalizedCreateNodesV2Context,
} from './utils';

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
