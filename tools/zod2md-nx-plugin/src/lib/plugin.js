import { dirname } from 'node:path';

export const createNodesV2 = [
  `**/zod2md.config.ts`,
  async (zod2MdConfigurationFiles, createNodesOptions, context) => {
    const options = createNodesOptions ?? {};
    const targetName = options.targetName ?? 'generate-docs';

    return Promise.all(
      zod2MdConfigurationFiles.map(async zod2MdConfigurationFile => {
        const projectRoot = dirname(zod2MdConfigurationFile);
        const normalizedProjectRoot = projectRoot === '.' ? '' : projectRoot;
        const result = {
          projects: {
            [normalizedProjectRoot]: {
              targets: {
                [targetName]: {
                  executor: 'nx:run-commands',
                  options: {
                    commands: [
                      'zod2md --config {args.config} --output {args.output}',
                      'prettier --write {args.output}',
                    ],
                    parallel: false,
                    config: '{projectRoot}/zod2md.config.ts',
                    output: '{projectRoot}/docs/{projectName}-reference.md',
                  },
                  cache: true,
                  inputs: [
                    'production',
                    '^production',
                    '{projectRoot}/zod2md.config.ts',
                  ],
                  outputs: ['{projectRoot}/docs/{outputFile}'],
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
