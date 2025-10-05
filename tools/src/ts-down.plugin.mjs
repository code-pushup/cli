import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const TSDOWN_CONFIG_GLOB = '**/tsdown.config.{ts,js,mjs}';

/**
 * Nx plugin to integrate TSDown into the build process.
 *
 * @example
 * ```json
 * {
 * "plugins": ["./tools/src/ts-down.plugin.mjs"]
 * }
 * ```
 * This will automatically add a build target to any project containing a `tsdown.config.ts`, `tsdown.config.js`, or `tsdown.config.mjs` file.
 */
const createNodesV2 = [
  TSDOWN_CONFIG_GLOB,
  async (configFiles, options, context) => {
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
          return [configFile, { projects: {} }];
        }

        const targetName = options?.targetName ?? 'tsd-build';

        const targets = {
          [targetName]: createTsdownBuildTarget(configFile, projectRoot),
        };

        const result = {
          projects: {
            [normalizedProjectRoot]: {
              targets,
            },
          },
        };

        return [configFile, result];
      }),
    );
  },
];

function createTsdownBuildTarget(configFile, projectRoot) {
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
