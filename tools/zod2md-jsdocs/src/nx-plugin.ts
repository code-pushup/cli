import type { CreateNodesV2, NxPlugin, TargetConfiguration } from '@nx/devkit';
import * as path from 'node:path';

const ZOD2MD_CONFIG_FILE = 'zod2md.config.ts';
const GENERATE_DOCS_TARGET_NAME = 'generate-docs';

interface DocsTargetConfigParams {
  config: string;
  output: string;
}

function createDocsTargetConfig({
  config,
  output,
}: DocsTargetConfigParams): TargetConfiguration {
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

const createNodesV2: CreateNodesV2 = [
  `**/${ZOD2MD_CONFIG_FILE}`,
  async configFilePaths => {
    return Promise.all(
      configFilePaths.map(async configFilePath => {
        const projectRoot = path.dirname(configFilePath);
        const normalizedProjectRoot = projectRoot === '.' ? '' : projectRoot;
        const output = '{projectRoot}/docs/{projectName}-reference.md';
        const config = `{projectRoot}/${ZOD2MD_CONFIG_FILE}`;

        return [
          configFilePath,
          {
            projects: {
              [normalizedProjectRoot]: {
                targets: {
                  [GENERATE_DOCS_TARGET_NAME]: createDocsTargetConfig({
                    config,
                    output,
                  }),
                },
              },
            },
          },
        ] as const;
      }),
    );
  },
];

const nxPlugin: NxPlugin = {
  name: 'zod2md-jsdocs-nx-plugin',
  createNodesV2,
};

module.exports = nxPlugin;
