import type {
  CreateNodesContextV2,
  CreateNodesResult,
  CreateNodesResultV2,
  CreateNodesV2,
} from '@nx/devkit';
import { PROJECT_JSON_FILE_NAME } from '../internal/constants.js';
import { PLUGIN_NAME } from './constants.js';
import { createTargets } from './target/targets.js';
import type { CreateNodesOptions } from './types.js';
import { normalizedCreateNodesV2Context } from './utils.js';

export const createNodesV2: CreateNodesV2<CreateNodesOptions> = [
  `**/${PROJECT_JSON_FILE_NAME}`,
  async (
    projectConfigurationFiles: readonly string[],
    createNodesOptions: unknown,
    context: CreateNodesContextV2,
  ): Promise<CreateNodesResultV2> => {
    const parsedCreateNodesOptions = createNodesOptions as CreateNodesOptions;
    const { pluginsConfig = {} } = context.nxJsonConfiguration;
    const pluginsConfigObj = pluginsConfig[PLUGIN_NAME] ?? {};
    const mergedOptions = { ...pluginsConfigObj, ...parsedCreateNodesOptions };

    return await Promise.all(
      projectConfigurationFiles.map(async projectConfigurationFile => {
        const normalizedContext = await normalizedCreateNodesV2Context(
          context,
          projectConfigurationFile,
          mergedOptions,
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
