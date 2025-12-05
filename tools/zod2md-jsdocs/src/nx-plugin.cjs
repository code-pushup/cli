const path = require('node:path');

const ZOD2MD_CONFIG_FILE = 'zod2md.config.ts';

const createNodesV2 = [
  `**/${ZOD2MD_CONFIG_FILE}`,
  async (zod2MdConfigurationFiles, createNodesOptions) => {
    const options = createNodesOptions ?? {};
    const targetName = options.targetName ?? 'generate-docs';

    return Promise.all(
      zod2MdConfigurationFiles.map(async zod2MdConfigurationFile => {
        const projectRoot = path.dirname(zod2MdConfigurationFile);
        const normalizedProjectRoot = projectRoot === '.' ? '' : projectRoot;
        const output = '{projectRoot}/docs/{projectName}-reference.md';
        const config = `{projectRoot}/${ZOD2MD_CONFIG_FILE}`;
        const result = {
          projects: {
            [normalizedProjectRoot]: {
              targets: {
                [targetName]: {
                  executor: 'nx:run-commands',
                  options: {
                    commands: [
                      `zod2md --config ${config} --output ${output}`,
                      `prettier --write ${output}`,
                    ],
                    parallel: false,
                  },
                  cache: true,
                  inputs: ['production', '^production', config],
                  outputs: [output],
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
const nxPlugin = {
  name: 'zod2md-jsdocs-nx-plugin',
  createNodesV2,
};

module.exports = nxPlugin;
module.exports.createNodesV2 = createNodesV2;
