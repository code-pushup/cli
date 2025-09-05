import type {
  CreateNodes,
  CreateNodesContext,
  CreateNodesContextV2,
  CreateNodesResult,
  CreateNodesResultV2,
  CreateNodesV2,
} from '@nx/devkit';
import { combineGlobPatterns } from 'nx/src/utils/globs';
import { PROJECT_JSON_FILE_NAME } from '../internal/constants.js';
import { createTargets } from './target/targets.js';
import type { CreateNodesOptions } from './types.js';
import {
  normalizedCreateNodesContext,
  normalizedCreateNodesV2Context,
} from './utils.js';

const PROJECT_JSON_FILE_GLOB = '**/project.json';
const PACKAGE_JSON_FILE_GLOB = '**/package.json';
const FILE_GLOB = combineGlobPatterns(
  PROJECT_JSON_FILE_GLOB,
  PACKAGE_JSON_FILE_GLOB,
);
// name has to be "createNodes" to get picked up by Nx <v20
export const createNodes: CreateNodes = [
  PROJECT_JSON_FILE_GLOB,
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

export const createNodesV2: CreateNodesV2<CreateNodesOptions> = [
  FILE_GLOB,
  async (
    projectConfigurationFiles: readonly string[],
    createNodesOptions: unknown,
    context: CreateNodesContextV2,
  ): Promise<CreateNodesResultV2> => {
    const parsedCreateNodesOptions = createNodesOptions as CreateNodesOptions;
    // projectRoot:true
    const projectConfig = new Map<string, boolean>();

    return await Promise.all(
      projectConfigurationFiles.map(async projectConfigurationFile => {
        const normalizedContext = await normalizedCreateNodesV2Context(
          context,
          projectConfigurationFile,
          parsedCreateNodesOptions,
        );
        if (projectConfig.has(projectConfigurationFile)) {
          return [
            projectConfigurationFile,
            {
              projects: {
                [normalizedContext.projectRoot]: {},
              },
            } satisfies CreateNodesResult,
          ];
        }
        projectConfig.set(normalizedContext.projectRoot, true);

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
