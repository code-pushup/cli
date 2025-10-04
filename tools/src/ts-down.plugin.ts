import type {
  CreateNodesContextV2,
  CreateNodesResultV2,
  CreateNodesV2,
  TargetConfiguration,
} from '@nx/devkit';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

export interface TsdownPluginOptions {
  targetName?: string;
}

const TSDOWN_CONFIG_GLOB = '**/tsdown.config.{ts,js,mjs}';

/**
 * Nx plugin to integrate TSDown into the build process.
 *
 * @example
 * ```json
 * {
 * "plugins": ["./tools/src/tsdown-plugin"]
 * }
 * ```
 * This will automatically add a build target to any project containing a `tsdown.config.ts`, `tsdown.config.js`, or `tsdown.config.mjs` file.
 */
export const createNodesV2: CreateNodesV2<TsdownPluginOptions> = [
  TSDOWN_CONFIG_GLOB,
  async (
    configFiles: readonly string[],
    options: TsdownPluginOptions | undefined,
    context: CreateNodesContextV2,
  ): Promise<CreateNodesResultV2> => {
    return await Promise.all(
      configFiles.map(async configFile => {
        const projectRoot = dirname(configFile);
        const normalizedProjectRoot = projectRoot === '.' ? '' : projectRoot;

        // Check if this is a valid project (has package.json or project.json)
        const hasPackageJson = existsSync(
          join(context.workspaceRoot, projectRoot, 'package.json'),
        );
        const hasProjectJson = existsSync(
          join(context.workspaceRoot, projectRoot, 'project.json'),
        );

        if (!hasPackageJson && !hasProjectJson) {
          return [configFile, { projects: {} }] as const;
        }

        const targetName = options?.targetName ?? 'tsd-build';

        const targets: Record<string, TargetConfiguration> = {
          [targetName]: createTsdownBuildTarget(configFile, projectRoot),
        };

        const result = {
          projects: {
            [normalizedProjectRoot]: {
              targets,
            },
          },
        };

        return [configFile, result] as const;
      }),
    );
  },
];

function createTsdownBuildTarget(
  configFile: string,
  projectRoot: string,
): TargetConfiguration {
  return {
    executor: 'nx:run-commands',
    options: {
      command: `node_modules/.bin/tsdown --config ${configFile}`,
      cwd: '{workspaceRoot}',
    },
    cache: true,
    inputs: [
      'production',
      '^production',
      {
        externalDependencies: ['tsdown'],
      },
    ],
    outputs: ['{projectRoot}/dist'],
    metadata: {
      description: 'Build the project using TSDown',
      technologies: ['tsdown'],
    },
  };
}

// Default export for nx.json plugins
const plugin = {
  name: '@code-pushup/tsdown-plugin',
  createNodesV2,
};

export default plugin;
