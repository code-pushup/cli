import { existsSync } from 'node:fs';
import { dirname, relative } from 'node:path';

const createNodesV2 = [
  '*/project.json',
  async (projectConfigurationFiles, opts = {}, context) => {
    const { targetName = 'lint-multi', maxWarnings = 0, cache = true } = opts;

    return await Promise.all(
      projectConfigurationFiles.map(async projectConfigurationFile => {
        const projectRoot = dirname(projectConfigurationFile);
        const projectName = projectRoot.split('/').pop();

        // Check if project has eslint.config.js
        const eslintConfigPath = `${projectRoot}/eslint.config.js`;

        let result = { projects: {} };

        if (
          projectName &&
          projectRoot.startsWith('packages/') &&
          existsSync(eslintConfigPath)
        ) {
          // Build the native ESLint command (concurrency will be passed as argument)
          const eslintCommand = [
            'npx eslint',
            `--config ${relative(context.workspaceRoot, eslintConfigPath)}`,
            `--max-warnings ${maxWarnings}`,
            '--no-error-on-unmatched-pattern',
            '--no-warn-ignored',
            cache ? '--cache' : '',
            `${projectRoot}/**/*.ts`,
            `${projectRoot}/package.json`,
          ]
            .filter(Boolean)
            .join(' ');

          result = {
            projects: {
              [projectRoot]: {
                targets: {
                  [targetName]: {
                    executor: 'nx:run-commands',
                    options: {
                      command: eslintCommand,
                    },
                    metadata: {
                      description: `Run ESLint with native CLI for ${projectName} (use --concurrency flag to set threads)`,
                      technologies: ['eslint'],
                    },
                    cache: true,
                    inputs: [
                      'default',
                      '{workspaceRoot}/eslint.config.js',
                      `{projectRoot}/eslint.config.js`,
                    ],
                    outputs: [],
                  },
                },
              },
            },
          };
        }

        return [projectConfigurationFile, result];
      }),
    );
  },
];

// Create an extensible plugin object with name property
const plugin = {
  createNodesV2,
  name: 'eslint-concurrency-target', // Pre-set name property that Nx wants to modify
};

export default plugin;
