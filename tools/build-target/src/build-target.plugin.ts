import type { CreateNodesV2, NxPlugin, TargetConfiguration } from '@nx/devkit';
import path from 'node:path';

const TSCONFIG_LIB_FILE = 'tsconfig.lib.json';
const BUILD_TARGET_NAME = 'build';

export function createBuildTargetConfig(): TargetConfiguration {
  return {
    dependsOn: ['^build'],
    inputs: ['production', '^production'],
    cache: true,
    executor: '@nx/js:tsc',
    outputs: ['{options.outputPath}'],
    options: {
      outputPath: '{projectRoot}/dist',
      main: '{projectRoot}/src/index.ts',
      tsConfig: `{projectRoot}/${TSCONFIG_LIB_FILE}`,
      assets: ['{projectRoot}/*.md', '{projectRoot}/bin/*'],
    },
  };
}

const createNodesV2: CreateNodesV2 = [
  `**/${TSCONFIG_LIB_FILE}`,
  async configFilePaths =>
    Promise.all(
      configFilePaths.map(async configFilePath => {
        const projectRoot = path.dirname(configFilePath);
        const normalizedProjectRoot = projectRoot === '.' ? '' : projectRoot;

        return [
          configFilePath,
          {
            projects: {
              [normalizedProjectRoot]: {
                targets: {
                  [BUILD_TARGET_NAME]: createBuildTargetConfig(),
                },
              },
            },
          },
        ] as const;
      }),
    ),
];

const buildTargetPlugin: NxPlugin = {
  name: 'build-target-nx-plugin',
  createNodesV2,
};

export default buildTargetPlugin;
