import {
  type CreateNodes,
  type CreateNodesContext,
  readJsonFile,
} from '@nx/devkit';
import { bold } from 'ansis';
import { dirname } from 'node:path';
import type { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { someTargetsPresent } from '../utils';
import { START_VERDACCIO_SERVER_TARGET_NAME } from './constants';
import { uniquePort } from './utils';

type CreateNodesOptions = {
  port?: string | number;
  config?: string;
  storage?: string;
  preTargets?: string | string[];
  verbose?: boolean;
};

export const createNodes: CreateNodes = [
  '**/project.json',
  (
    projectConfigurationFile: string,
    opts: undefined | unknown,
    context: CreateNodesContext,
  ) => {
    const {
      port = uniquePort(),
      config = '.verdaccio/config.yml',
      storage = 'tmp/local-registry/storage',
      verbose = false,
      preTargets = ['e2e'],
    } = (opts ?? {}) as CreateNodesOptions;
    const root = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      projectConfigurationFile,
    );

    const hasPreVerdaccioTargets = someTargetsPresent(
      projectConfiguration.targets ?? {},
      preTargets,
    );

    if (!hasPreVerdaccioTargets) {
      return {};
    }

    return {
      projects: {
        [root]: {
          targets: verdaccioTargets({
            port,
            config,
            storage,
            preTargets,
          }),
        },
      },
    };
  },
];

function verdaccioTargets({
  port,
  config,
  storage,
}: Required<Omit<CreateNodesOptions, 'verbose'>>) {
  return {
    [START_VERDACCIO_SERVER_TARGET_NAME]: {
      executor: '@nx/js:verdaccio',
      options: {
        port,
        config,
        storage,
      },
    },
    ['setup-deps']: {
      dependsOn: [
        {
          target: 'npm-install',
          projects: 'dependencies',
          params: 'forward',
        },
      ],
      executor: 'nx:run-commands',
      options: {
        commands: [
          `echo "Dependencies are ready to use!"`,
          //  `nx run-many -t publish -p ${deps?.join(',')}`,
          // NPM install needs to be run sequentially as it can cause issues with installing dependencies multiple times
          //  `nx run-many -t npm-install -p ${deps?.join(',')} --parallel=1`,
        ],
        parallel: false,
      },
    },
  };
}
