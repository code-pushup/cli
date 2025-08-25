import { existsSync } from 'node:fs';
import { dirname, relative } from 'node:path';

function matchesIncludePattern(filePath, includePattern) {
  // Simple pattern matching for {packages,e2e,testing,examples}/*/project.json
  const normalizedPath = filePath.replace(/\\/g, '/');
  const pattern = includePattern
    .replace(/\{([^}]+)\}/, '($1)')
    .replace(/,/g, '|')
    .replace(/\*/g, '[^/]+');
  const regex = new RegExp(`^${pattern}$`);
  return regex.test(normalizedPath);
}

const createNodesV2 = [
  '**/project.json',
  async (projectConfigurationFiles, opts = {}, context) => {
    const {
      targetName = 'lint-multi',
      maxWarnings = 0,
      cache = true,
      include = '{packages,e2e,testing,examples}/*/project.json',
    } = opts;

    // Filter project files based on include pattern
    const filteredFiles = projectConfigurationFiles.filter(file =>
      matchesIncludePattern(file, include),
    );

    return await Promise.all(
      filteredFiles.map(async projectConfigurationFile => {
        const projectRoot = dirname(projectConfigurationFile);
        const projectName = projectRoot.split('/').pop();

        // Check if project has eslint.config.js, fallback to root config
        const projectEslintConfigPath = `${projectRoot}/eslint.config.js`;
        const rootEslintConfigPath = 'eslint.config.js';
        const eslintConfigPath = existsSync(projectEslintConfigPath)
          ? projectEslintConfigPath
          : rootEslintConfigPath;

        let result = { projects: {} };

        if (
          projectName &&
          projectRoot !== '.' &&
          !projectRoot.startsWith('dist/')
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
                      ...(existsSync(projectEslintConfigPath)
                        ? [`{projectRoot}/eslint.config.js`]
                        : []),
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
