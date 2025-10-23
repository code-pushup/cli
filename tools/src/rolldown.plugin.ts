import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROLLDOWN_CONFIG_GLOB = '**/rolldown.config.{ts,js,mjs}';

/**
 * Nx plugin to integrate Rolldown into the build process.
 *
 * @example
 * ```json
 * {
 *   "plugins": ["./tools/src/rolldown.plugin.ts"]
 * }
 * ```
 * This will automatically add a build target to any project containing a `rolldown.config.ts`, `rolldown.config.js`, or `rolldown.config.mjs` file.
 */
const createNodesV2 = [
  ROLLDOWN_CONFIG_GLOB,
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

        const targetName = options?.targetName ?? 'build';

        const targets = {
          [targetName]: createRolldownBuildTarget(configFile, projectRoot),
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

function createRolldownBuildTarget(configFile, projectRoot) {
  // Extract just the config filename from the path
  const configFileName = configFile.split('/').pop();

  return {
    dependsOn: ['^build'],
    executor: 'nx:run-commands',
    options: {
      command: `rolldown -c ${configFileName}`,
      cwd: projectRoot,
      // needed for nx-verdaccio
      outputPath: '{projectRoot}/dist',
    },
    cache: true,
    inputs: [
      'production',
      '^production',
      {
        externalDependencies: ['rolldown'],
      },
    ],
    outputs: ['{projectRoot}/dist'],
    metadata: {
      description: 'Build the project using Rolldown',
      technologies: ['rolldown'],
    },
  };
}

// Default export for nx.json plugins
const plugin = {
  name: '@code-pushup/rolldown-plugin',
  createNodesV2,
};

export default plugin;
