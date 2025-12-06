const path = require('node:path');

const ZOD2MD_CONFIG_FILE = 'zod2md.config.ts';
const TS_PATCH_TARGET_NAME = 'ts-patch';
const GENERATE_DOCS_TARGET_NAME = 'generate-docs';

/**
 * Creates the ts-patch target configuration
 * @returns {object} ts-patch target configuration
 */
const createTsPatchTargetConfig = {
  command: 'ts-patch install',
  cache: true,
  inputs: ['sharedGlobals', { runtime: 'ts-patch check' }],
};

/**
 * Creates the docs generation target configuration
 * @param {object} params - Configuration parameters
 * @param {string} params.config - Path to the zod2md config file
 * @param {string} params.output - Path to the output markdown file
 * @returns {object} Docs target configuration
 */
function createDocsTargetConfig({ config, output }) {
  return {
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
  };
}

const createNodesV2 = [
  `**/${ZOD2MD_CONFIG_FILE}`,
  async (zod2MdConfigurationFiles, createNodesOptions) => {
    const {
      docsTargetName = GENERATE_DOCS_TARGET_NAME,
      jsDocsTypesAugmentation = true,
    } = createNodesOptions ?? {};

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
                ...(jsDocsTypesAugmentation
                  ? { [TS_PATCH_TARGET_NAME]: createTsPatchTargetConfig }
                  : {}),
                [docsTargetName]: createDocsTargetConfig({
                  config,
                  output,
                }),
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
