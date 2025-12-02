import { dirname } from 'node:path';

export const createNodesV2 = [
  `**/zod2md.config.ts`,
  async (zod2MdConfigurationFiles, createNodesOptions, context) => {
    return Promise.all(
      zod2MdConfigurationFiles.map(async zod2MdConfigurationFile => {
        const projectRoot = dirname(zod2MdConfigurationFile);
        const normalizedProjectRoot = projectRoot === '.' ? '' : projectRoot;
        const result = {
          projects: {
            [normalizedProjectRoot]: {
              targets: {
                'generate-docs': {
                  executor: 'nx:run-commands',
                  options: {
                    commands: [
                      'zod2md --config {projectRoot}/zod2md.config.ts',
                      'prettier --write {projectRoot}/docs/{projectName}-reference.md',
                    ],
                    parallel: false,
                  },
                  cache: true,
                  inputs: [
                    'production',
                    '^production',
                    '{projectRoot}/zod2md.config.ts',
                  ],
                  outputs: ['{projectRoot}/docs/{projectName}-reference.md'],
                },
              },
            },
          },
        };

        return [zod2MdConfigurationFile, result];
      }),
    );
  },
];

// default export for nx.json#plugins
const plugin = {
  name: 'zod2md-nx-plugin',
  createNodesV2,
};

export default plugin;
