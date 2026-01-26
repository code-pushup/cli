import type { CreateNodesV2, NxPlugin, TargetConfiguration } from '@nx/devkit';
import * as path from 'node:path';

type DocsTargetConfigParams = {
  config: string;
  output: string;
};
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
const DEFAULT_ZOD2MD_CONFIG_FILE_NAME = 'zod2md.config.{js,ts}';
const GENERATE_DOCS_TARGET_NAME = 'generate-docs';
const PATCH_TS_TARGET_NAME = 'patch-ts';
const createNodesV2: CreateNodesV2 = [
  `**/${DEFAULT_ZOD2MD_CONFIG_FILE_NAME}`,
  async (configFilePaths, _options) =>
    Promise.all(
      configFilePaths.map(async configFilePath => {
        const projectRoot = path.dirname(configFilePath);
        const normalizedProjectRoot = projectRoot === '.' ? '' : projectRoot;
        const output = '{projectRoot}/docs/{projectName}-reference.md';
        const configFileName = path.basename(configFilePath);
        const config = `{projectRoot}/${configFileName}`;
        return [
          configFilePath,
          {
            projects: {
              [normalizedProjectRoot]: {
                targets: {
                  build: {
                    dependsOn: [
                      {
                        target: GENERATE_DOCS_TARGET_NAME,
                        projects: 'self',
                      },
                    ],
                    syncGenerators: [
                      './tools/zod2md-jsdocs/dist:sync-zod2md-setup',
                    ],
                  },
                  [GENERATE_DOCS_TARGET_NAME]: createDocsTargetConfig({
                    config,
                    output,
                  }),
                  [PATCH_TS_TARGET_NAME]: {
                    command: 'ts-patch install',
                    cache: true,
                    inputs: [
                      'sharedGlobals',
                      {
                        runtime: 'ts-patch check',
                      },
                    ],
                  },
                },
              },
            },
          },
        ] as const;
      }),
    ),
];
const nxPlugin: NxPlugin = {
  name: 'zod2md-jsdocs-nx-plugin',
  createNodesV2,
};
export default nxPlugin;
